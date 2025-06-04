import type User from '@models/User.class'
import type Service from '@models/Service.class'
import type GatewayAccount from '@models/GatewayAccount.class'
import type { Request } from 'express'
import type StripeAccountSetup from '@models/StripeAccountSetup.class'
import ClientSessionsCookie from '@utils/types/client-sessions/ClientSessionsCookie'

type MessageState = 'success' | 'error' | 'info'
type Icon = '&check;'

interface Message {
  state: MessageState
  icon?: Icon
  heading: string
  body?: string
}

export default interface ServiceRequest<T = never> extends Request {
  user: User
  service: Service
  account: GatewayAccount
  gatewayAccountStripeProgress?: StripeAccountSetup
  flash(type: string, message: Message): void
  body: T
  session: ClientSessionsCookie
}
