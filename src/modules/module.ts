import { RequestHandler, Router } from 'express'
import { formattedPathFor } from '@utils/simplified-account/format/format-path'
import { ValidationChain } from 'express-validator'

export abstract class BaseModule {
  static path?: string
  static middleware?: RequestHandler[]
  static getMiddleware?: RequestHandler[]
  static postMiddleware?: RequestHandler[]
  static get?: RequestHandler
  static post?: RequestHandler
  static postValidation?: ValidationChain[]
  static [key: string]: unknown

  // @ts-ignore
  static router(router?: Router) {
    if (!this.path) {
      throw new Error(`path is undefined for module [${this.name}]`)
    }
    router ??= Router({ mergeParams: true })

    if (this.get) {
      console.log(`Registering GET ${this.path}`)
      router.get(this.path, ...(this.middleware ?? []), ...(this.getMiddleware ?? []), this.get)
    }
    if (this.post) {
      console.log(`Registering POST ${this.path}`)
      router.post(
        this.path,
        ...(this.middleware ?? []),
        ...(this.postMiddleware ?? []),
        ...(this.postValidation ?? []),
        this.post
      )
    }

    Object.getOwnPropertyNames(this)
      .map((name) => this[name])
      // @ts-expect-error this is fine
      .filter((value: { prototype: unknown }) => value?.prototype instanceof BaseModule)
      // @ts-expect-error this is fine
      .forEach((subModule: typeof BaseModule) => {
        subModule.router(router)
      })

    return router
  }

  static formatPath(...params: string[]) {
    return formattedPathFor(this.path!, ...params)
  }
}
