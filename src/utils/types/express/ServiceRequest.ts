import type User from '@models/User.class'
import type Service from '@models/Service.class'
import type GatewayAccount from '@models/GatewayAccount.class'
import type { Request } from 'express'
import type StripeAccountSetup from '@models/StripeAccountSetup.class'

type MessageState = 'success' | 'error' | 'info'

interface Message {
  state: MessageState
  icon?: string
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
}
