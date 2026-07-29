import express from 'express'
import User from '@models/user/User.class'
import ClientSessionsCookie from '../client-sessions/ClientSessionsCookie'
export interface AuthenticatedRequest<P = never> extends express.Request<P> {
  user: User
  session: ClientSessionsCookie
}
