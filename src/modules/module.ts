import { RequestHandler, Router } from 'express'
import { formattedPathFor } from '@utils/simplified-account/format/format-path'

export abstract class BaseModule {
  static path?: string
  static middleware?: RequestHandler[]
  static getMiddleware?: RequestHandler[]
  static postMiddleware?: RequestHandler[]
  static get?: RequestHandler
  static post?: RequestHandler

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
      router.post(this.path, ...(this.middleware ?? []), ...(this.postMiddleware ?? []), this.post)
    }

    Object.values(this)
      .filter((value: { prototype: unknown }) => value?.prototype instanceof BaseModule)
      .forEach((subModule: typeof BaseModule) => {
        subModule.router(router)
      })

    return router
  }

  static formatPath(...params: string[]) {
    return formattedPathFor(this.path!, ...params)
  }
}
