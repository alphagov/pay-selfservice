import type Service from '@models/Service.class'
import type GatewayAccount from '@models/GatewayAccount.class'
import UserRequest from "@utils/types/express/UserRequest";

export default interface ServiceRequest<T = never> extends UserRequest<T> {
  service: Service
  account: GatewayAccount
}
