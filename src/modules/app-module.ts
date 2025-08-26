import { RequestHandler } from "express";
import {ValidationChain} from "express-validator";
import permissionMiddleware from "@middleware/permission";
import userIsAuthorised from '@middleware/user-is-authorised'
import {experimentalFeature, simplifiedAccountStrategy} from "@middleware/simplified-account";

(Symbol as { metadata: symbol }).metadata ??= Symbol('Symbol.metadata')

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
interface BaseModuleConstructor extends Function {
  path?: string
}

export abstract class BaseModule implements IBaseModule {
  static path?: string
}

export interface IBaseModule {
  get?: RequestHandler
  post?: RequestHandler
  constructor: BaseModuleConstructor
}

export function Path (path: string) {
  return function (target: BaseModuleConstructor) {
    target.path = path
  }
}

export const handlersSymbol = Symbol('handlers')
export interface ModuleMetadata {
  get: RequestHandler[]
  post: RequestHandler[]
  class: RequestHandler[]
}

function wrapMiddleware (context:DecoratorContext, middleware: RequestHandler) {
  const handlers = (context.metadata[handlersSymbol] as ModuleMetadata | undefined) ??= {
    get: [],
    post: [],
    class: []
  };
  if (context.kind === 'class') {
    handlers.class.push(middleware)
  } else if (context.kind === 'method' && context.name === 'get') {
    handlers.get.push(middleware)
  } else if (context.kind === 'method' && context.name === 'post') {
    handlers.post.push(middleware)
  } else {
    throw new Error('illegal use of decorator')
  }
}

export function Authorised (target: RequestHandler | BaseModuleConstructor, context: DecoratorContext) {
  return wrapMiddleware(context, userIsAuthorised)
}

export function Permission (requiredPermission: string) {
  return function (target: RequestHandler | BaseModuleConstructor, context: DecoratorContext) {
    return wrapMiddleware(context, permissionMiddleware(requiredPermission))
  }
}

export function Validate (validations: ValidationChain[]) {
  return function (target: RequestHandler | BaseModuleConstructor, context: DecoratorContext) {
    return wrapMiddleware(context, validations as unknown as RequestHandler)
  }
}

export function Experimental (target: RequestHandler | BaseModuleConstructor, context: DecoratorContext) {
  return wrapMiddleware(context, experimentalFeature)
}

export function ServiceRoute (target: RequestHandler | BaseModuleConstructor, context: DecoratorContext) {
  return wrapMiddleware(context, simplifiedAccountStrategy)
}

export function Middleware (middleware: RequestHandler) {
  return function (target: RequestHandler | BaseModuleConstructor, context: DecoratorContext) {
    return wrapMiddleware(context, middleware)
  }
}
