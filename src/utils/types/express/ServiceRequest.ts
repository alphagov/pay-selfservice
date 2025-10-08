import type User from '@models/user/User.class'
import type Service from '@models/service/Service.class'
import type GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import type StripeAccountSetup from '@models/StripeAccountSetup.class'
import ClientSessionsCookie from '@utils/types/client-sessions/ClientSessionsCookie'
import { Message } from '@utils/types/express/Message'
import { Request } from 'express'

export default interface ServiceRequest<T = unknown> extends Request {
  user: User
  service: Service
  account: GatewayAccount
  gatewayAccountStripeProgress?: StripeAccountSetup
  flash(type: string, message: Message): void
  body: T
  session: ClientSessionsCookie
}
