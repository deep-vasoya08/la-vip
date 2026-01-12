import { User as PayloadUser } from 'payload/auth'

export interface User extends PayloadUser {
  role?: 'admin' | 'user'
}

declare global {
  namespace Express {
    interface User extends PayloadUser {
      role?: 'admin' | 'user'
    }
  }
}
