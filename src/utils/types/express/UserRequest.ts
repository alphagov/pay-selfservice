import type {Request} from "express";
import type User from "@models/User.class";
import type Message from "@utils/types/express/Message";
import ClientSessionsCookie from "@utils/types/client-sessions/ClientSessionsCookie";

export default interface UserRequest<T = never> extends Request {
  user: User
  flash(type: string, message: Message): void
  body: T,
  session: ClientSessionsCookie
}
