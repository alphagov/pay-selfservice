import type User from '@models/user/User.class'
import type Service from '@models/service/Service.class'
import type GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import type StripeAccountSetup from '@models/StripeAccountSetup.class'
import ClientSessionsCookie from '@utils/types/client-sessions/ClientSessionsCookie'
import { Message } from "@utils/types/express/Message";
import {Response} from "express-serve-static-core";

declare module 'express-serve-static-core' {
  interface Request<P, ResBody, ReqBody, ReqQuery, Locals> {
    user?: User
    service?: Service
    account?: GatewayAccount
    gatewayAccountStripeProgress?: StripeAccountSetup
    flash?(type: string, message: Message): void
    session?: ClientSessionsCookie
    params: P
    body: ReqBody
    query: ReqQuery
    res?: Response<ResBody, Locals> | undefined;
  }
}
