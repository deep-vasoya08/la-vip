import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's ID */
      id: string
      /** The user's role */
      role: string
      /** The authentication provider used */
      provider?: string
      /** The user's phone number */
      phoneNumber?: string
    } & DefaultSession['user']
    /** The payload token for API access */
    payloadToken?: string
  }

  interface User {
    /** The user's role */
    role: string
    /** The user's token for API access */
    token?: string
    /** The user's phone number */
    phoneNumber?: string
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's ID */
    id: string
    /** The user's role */
    role: string
    /** The payload token for API access */
    payloadToken?: string
    /** The authentication provider used */
    provider?: string
    /** The user's phone number */
    phoneNumber?: string
  }
}
