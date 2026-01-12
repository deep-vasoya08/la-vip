import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Account, Profile, Session, User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

// Define PayloadUser type locally since we can't import it properly
type _PayloadUser = {
  id: string | number
  email: string
  name?: string
  image?: string
  role?: 'admin' | 'user'
  googleId?: string
  appleId?: string
}

export const authOptions: NextAuthOptions = {
  secret: process.env.PAYLOAD_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID as string,
      clientSecret: process.env.APPLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, _req) {
        const { email, password } = credentials as { email: string; password: string }

        // Handle secure auto-login case with session token
        if (password && password.startsWith('auto-login-session:')) {
          try {
            const sessionToken = password.replace('auto-login-session:', '')

            if (!sessionToken || sessionToken.length !== 64) {
              console.error('Invalid auto-login session token format')
              return null
            }

            const payload = await getPayload({ config })

            // Find and validate the one-time session token
            const sessions = await payload.find({
              collection: 'auto_login_sessions',
              where: {
                and: [
                  { sessionToken: { equals: sessionToken } },
                  { used: { equals: false } },
                  { expiresAt: { greater_than: new Date() } },
                ],
              },
            })

            if (sessions.docs.length === 0) {
              console.error('Auto-login session token not found, expired, or already used')
              return null
            }

            const session = sessions.docs[0]
            if (!session) {
              console.error('Auto-login session not found')
              return null
            }

            // Get the user from the session
            const userId = typeof session.user === 'object' ? session.user?.id : session.user
            if (!userId) {
              console.error('Invalid user ID in session')
              return null
            }

            const user = await payload.findByID({
              collection: 'users',
              id: userId,
            })

            if (!user || user.email !== email) {
              console.error('User mismatch in auto-login session')
              return null
            }

            // Mark session as used (one-time use only)
            await payload.update({
              collection: 'auto_login_sessions',
              id: session.id,
              data: {
                used: true,
              },
            })

            console.log(`✅ Auto-login successful for user ${user.email} using session token`)

            return {
              id: String(user.id),
              email: user.email,
              name: user.name || user.email,
              role: user.role || 'user',
              phoneNumber: user.phoneNumber || undefined,
              autoLogin: true,
            }
          } catch (error) {
            console.error('Auto-login session error:', error)
            return null
          }
        }

        // Handle normal login
        try {
          // Load Payload, which will be available on API routes
          const payload = await getPayload({
            config,
          })

          // Authenticate with Payload credentials
          console.log('Attempting login with:', { email, password: password ? '***' : 'undefined' })

          const { user } = await payload.login({
            collection: 'users',
            data: {
              email: email,
              password: password,
            },
          })
          console.log('user data ', user)
          // Return the user object with token, converting id to string for NextAuth compatibility
          return {
            id: String(user.id), // Convert to string to match NextAuth User type
            email: user.email,
            name: user.name,
            role: user.role || 'user',
            phoneNumber: user.phoneNumber || undefined,
            token: user.token, // Include token to be stored in session
          }
        } catch (error) {
          console.error('Auth error:', error)
          console.error('Login attempt failed for email:', email)

          // Check if it's a specific authentication error
          if (error && typeof error === 'object' && 'message' in error) {
            console.error('Error details:', error.message)
          }

          return null
        }
      },
    }),
  ],
  callbacks: {
    async signIn({
      user,
      account,
      profile,
    }: {
      user: User
      account: Account | null
      profile?: Profile
    }): Promise<boolean> {
      // If OAuth authentication (Google or Apple)
      if ((account?.provider === 'google' || account?.provider === 'apple') && profile) {
        try {
          // Log Google user data to console (as requested)
          console.log(`${account.provider} user data:`, { user, account, profile })

          // Initialize Payload
          const payload = await getPayload({
            config,
          })

          // Field name in users collection based on provider
          const providerIdField = account.provider === 'google' ? 'googleId' : 'appleId'

          // Try to find user by provider ID
          const existingUsers = await payload.find({
            collection: 'users',
            where: {
              [providerIdField]: {
                equals: account.providerAccountId,
              },
            },
          })

          // If user doesn't exist, create a new one
          if (existingUsers.totalDocs === 0) {
            // We also want to check if the email is already in use
            const emailUsers = await payload.find({
              collection: 'users',
              where: {
                email: {
                  equals: user.email as string,
                },
              },
            })

            if (emailUsers.totalDocs === 0) {
              // Create a new user
              // Create user data with properly typed role
              // Create new user with required fields
              // Using a type with specific properties instead of Record<string, any>
              const userData: {
                email: string
                name: string
                password: string
                role: 'user' | 'admin'
                image?: string
                googleId?: string
                appleId?: string
              } = {
                email: user.email as string,
                name: (user.name as string) || 'User',
                password:
                  Math.random().toString(36).slice(-10) +
                  Math.random().toString(36).toUpperCase().slice(-2), // Generate random password for account
                role: 'user' as 'user' | 'admin', // Properly type the role
              }

              // Add image if available
              // if (user.image) {
              //   userData.image = user.image as string
              // }
              userData.image = ''

              // Add provider-specific ID
              if (account.provider === 'google') {
                userData.googleId = account.providerAccountId
              } else if (account.provider === 'apple') {
                userData.appleId = account.providerAccountId
              }

              try {
                const newUser = await payload.create({
                  collection: 'users',
                  data: userData,
                })
                console.log(`Created new user with ${account.provider} account:`, newUser.id)
              } catch (createError) {
                console.error(
                  `Error creating new user with ${account.provider} account:`,
                  createError,
                )
                // Re-throw to prevent login if user creation fails
                throw createError
              }
            } else {
              // Update existing user with provider ID
              // Using a type with specific properties instead of Record<string, any>
              const updateData: {
                image?: string
                googleId?: string
                appleId?: string
              } = {}

              // Add image if available from OAuth or existing user
              // if (user?.image || (emailUsers.docs[0] && emailUsers.docs[0].image)) {
              //   updateData?.image = user.image || (emailUsers.docs[0] && emailUsers.docs[0].image)
              // }
              updateData.image = ''

              // Add provider-specific ID
              if (account.provider === 'google') {
                updateData.googleId = account.providerAccountId
              } else if (account.provider === 'apple') {
                updateData.appleId = account.providerAccountId
              }

              try {
                // Check if we have valid email users to update
                if (
                  emailUsers.docs &&
                  emailUsers.docs.length > 0 &&
                  emailUsers.docs[0] &&
                  emailUsers.docs[0].id
                ) {
                  // Store result but also log it immediately
                  const result = await payload.update({
                    collection: 'users',
                    id: emailUsers.docs[0].id,
                    data: updateData,
                  })
                  console.log(`Updated existing user with ${account.provider} ID:`, result.id)
                } else {
                  console.error(`No valid email users found to update with ${account.provider} ID`)
                  return false
                }
              } catch (updateError) {
                console.error(
                  `Error updating existing user with ${account.provider} ID:`,
                  updateError,
                )
                throw updateError
              }
            }
          }

          // Allow sign-in to proceed
          return true
        } catch (error) {
          console.error(`Error in ${account.provider} sign in:`, error)
          // Return false to prevent sign-in if there was an error
          return false
        }
      }

      // For email/password auth, just return true
      return true
    },

    async jwt({
      token,
      user,
      account,
    }: {
      token: JWT
      user?: User
      account?: Account | null
    }): Promise<JWT> {
      // Initial sign in
      if (account && user) {
        // Initialize basic token data
        token.email = user.email
        token.name = user.name

        // For OAuth providers (Google/Apple), get the database user ID
        if (account.provider === 'google' || account.provider === 'apple') {
          try {
            // Initialize Payload
            const payload = await getPayload({
              config,
            })

            // Field name in users collection based on provider
            const providerIdField = account.provider === 'google' ? 'googleId' : 'appleId'

            // Find the user by provider ID
            const existingUsers = await payload.find({
              collection: 'users',
              where: {
                [providerIdField]: {
                  equals: account.providerAccountId,
                },
              },
            })

            // If user exists in database, use their database ID
            if (existingUsers.totalDocs > 0 && existingUsers.docs[0]) {
              // Use the actual database ID instead of provider ID
              token.id = String(existingUsers.docs[0].id)
              token.role = existingUsers.docs[0].role || 'user'
              token.phoneNumber = existingUsers.docs[0].phoneNumber || undefined
              token.dbId = String(existingUsers.docs[0].id) // Store database ID separately for clarity
              console.log(`Found user in database: ${token.id} (${account.provider} login)`)
            } else {
              // Fallback to provider ID if something went wrong
              token.id = user.id
              console.log(`User not found in database: ${user.id} (${account.provider} login)`)
            }
          } catch (error) {
            console.error(`Error finding user by ${account.provider} ID:`, error)
            // Fallback to provider ID
            token.id = user.id
          }
        } else {
          // For credentials provider, use the ID from the user object
          token.id = user.id

          // Save role information
          if ('role' in user) {
            token.role = user.role
          }

          // Save phone number if available
          if ('phoneNumber' in user) {
            token.phoneNumber = user.phoneNumber
          }

          // Save authorization token if available (from credentials provider)
          if ('token' in user) {
            token.payloadToken = user.token
          }
        }

        // Save provider information
        if (account.provider) {
          token.provider = account.provider
        }
      }

      // Refresh phone number from database if token exists but no phone number in token
      // This handles cases where phone number was added after login
      if (token.id && !token.phoneNumber) {
        try {
          const payload = await getPayload({ config })
          const user = await payload.findByID({
            collection: 'users',
            id: Number(token.id),
          })

          if (user && user.phoneNumber) {
            token.phoneNumber = user.phoneNumber
          }
        } catch (error) {
          console.error('Error refreshing phone number:', error)
        }
      }

      return token
    },

    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      // Add custom token properties to session
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.provider = token.provider as string
      session.user.phoneNumber = token.phoneNumber as string
      session.payloadToken = token.payloadToken as string

      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}
