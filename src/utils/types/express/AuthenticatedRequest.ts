import express from 'express'
import User from '@models/user/User.class'
import ClientSessionsCookie from '../client-sessions/ClientSessionsCookie'

export interface AuthenticatedRequest extends express.Request {
  user: User
  session: ClientSessionsCookie
}
