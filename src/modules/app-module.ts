import 'reflect-metadata'

import express, {Express, IRouter, NextFunction, RequestHandler, Router} from "express";
import {ValidationChain} from "express-validator";
import permissionMiddleware from "@middleware/permission";
import userIsAuthorised from '@middleware/user-is-authorised'
import getSimplifiedAccount from "@middleware/simplified-account/simplified-account-strategy.middleware";
import {experimentalFeature, simplifiedAccountStrategy} from "@middleware/simplified-account";
import Base = Mocha.reporters.Base;
import * as console from "node:console";

(Symbol as { metadata: symbol }).metadata ??= Symbol('Symbol.metadata')
// const Module = {}

export interface AppModule {
  path: string
  get?: express.RequestHandler | GetModule
  postValidation?: express.RequestHandler
  post?: express.RequestHandler | PostModule
}

export interface GetModule {
  permission?: RequestHandler
  handler: express.RequestHandler
}

// export abstract class BaseModule {
//   static PATH: string
//   get () => unknown
// }


// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
interface BaseModuleConstructor extends Function {
  path?: string
}

export abstract class TestClass implements BaseModule {
  // get?: RequestHandler
  // post?: RequestHandler
  static path?: string
  // abstract PATH: string
}

export interface BaseModule {
  // get(...args: unknown[]): unknown
  // PATH: string
  get?: RequestHandler
  post?: RequestHandler
  constructor: BaseModuleConstructor
}


export interface PostModule extends GetModule {
  validation?: express.RequestHandler
}

// export function Validate (validation: ValidationChain[]) {
//   return function (target: express.RequestHandler){
//     return Router({ mergeParams: true })
//       .use(validation)
//       .use(target)
//   }
// }

// export function Permission (requiredPermission: string) {
//   return function (target: express.RequestHandler): RequestHandler {
//     return Router({ mergeParams: true })
//       .use(permissionMiddleware(requiredPermission))
//       .use(target)
//   }
// }

// export function Authorised (target: RequestHandler) {
//   console.log('authorised')
//
//   return Router({ mergeParams: true })
//     .use(userIsAuthorised)
//     .use(target)
// }

type ModuleConstructorBase<T> = new () => BaseModule
interface ModuleConstructor<T> extends ModuleConstructorBase<T> {
  path?: string
}

export function ClassDec<T> (target: ModuleConstructor<T>): any {

}

// export function Service (target: RequestHandler): RequestHandler {
//   return Router({ mergeParams: true })
//     .use(simplifiedAccountStrategy)
//     .use(target)
// }

// const mdkey = Symbol('metadata')
// export function ClassDec<T> (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
//   return Reflect.metadata(mdkey, 'test')
// }

export function TestDec (originalMethod: any, context: DecoratorContext) {
  console.log(context.name)
  console.log(context)

  context.metadata[context.name!] = "test"
}

export interface DecoratorMetadata {
  handlers: RequestHandler[]
}

// interface OrderedHandler {
//   handler: RequestHandler,
//   precedence: number
// }

export const pathSymbol = Symbol('path')
export function Path<T> (path: string) {
  return function (target: ModuleConstructor<T>, context: DecoratorContext) {
    console.log('path decorator')
    console.log(target)
    target.path = path
    console.log(target)

    // context.metadata[pathSymbol] = path
  }
}

export function pathFor (ModuleClass: new () => BaseModule) {
  return ModuleClass[Symbol.metadata]?.[pathSymbol] as string
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

export function Authorised<T> (target: RequestHandler | ModuleConstructor<T>, context: DecoratorContext) {
  return wrapMiddleware(context, userIsAuthorised)
}

export function Permission<T> (requiredPermission: string) {
  return function (target: RequestHandler | ModuleConstructor<T>, context: DecoratorContext) {
    return wrapMiddleware(context, permissionMiddleware(requiredPermission))
  }
}

export function Validate<T> (validations: ValidationChain[]) {
  return function (target: RequestHandler | ModuleConstructor<T>, context: DecoratorContext) {
    return wrapMiddleware(context, validations as unknown as RequestHandler)
  }
}

export function Experimental<T> (target: RequestHandler | ModuleConstructor<T>, context: DecoratorContext) {
  return wrapMiddleware(context, experimentalFeature)
}

export function Service<T> (target: RequestHandler | ModuleConstructor<T>, context: DecoratorContext) {
  // console.log('metadata symbol')
  // console.log(Symbol.metadata)
  // console.log(context)
  // const handlers = (context.metadata[handlersSymbol] as ModuleMetadata | undefined) ??= {
  //   get: [],
  //   post: [],
  //   class: []
  // };
  // if (context.kind === 'class') {
  //   handlers.class.push(simplifiedAccountStrategy)
  // } else if (context.kind === 'method' && context.name === 'get') {
  //   handlers.get.push(simplifiedAccountStrategy)
  // } else if (context.kind === 'method' && context.name === 'post') {
  //   handlers.post.push(simplifiedAccountStrategy)
  // } else {
  //   throw new Error('illegal use of decorator')
  // }
  return wrapMiddleware(context, simplifiedAccountStrategy)

  // if(context.metadata![context.name!]) {
  //   (context.metadata![context.name!] as DecoratorMetadata).handlers.push(
  //     simplifiedAccountStrategy
  //   )
  // } else {
  //   context.metadata![context.name!] = {
  //     handlers: [simplifiedAccountStrategy]
  //   }
  // }
  // console.log(context)
}

export function Middleware<T> (middleware: RequestHandler) {
  return function (target: RequestHandler | ModuleConstructor<T>, context: DecoratorContext) {
    return wrapMiddleware(context, middleware)
  }
}


// export function Middleware (middleware: RequestHandler) {
//   return function (target: RequestHandler): RequestHandler {
//     return Router({ mergeParams: true })
//       .use(middleware)
//       .use(target)
//   }
// }

export function Get(path: string) {
  return function (target: express.RequestHandler) {
    return express()
      .get(path, target)
  }
}
// export {
//   Module
// }
