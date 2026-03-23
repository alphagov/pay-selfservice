import express from 'express'
import User from '@models/user/User.class'

export interface AuthenticatedRequest extends express.Request {
  user: User
}
