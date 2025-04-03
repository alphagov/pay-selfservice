import User from "@models/User.class";
import Service from "@models/Service.class";
import GatewayAccount from "@models/GatewayAccount.class";

export default interface SettingsRequest extends Express.Request {
    user: User
    service: Service
    account: GatewayAccount
}
