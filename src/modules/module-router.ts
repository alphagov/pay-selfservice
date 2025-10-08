import { Router } from 'express'
import {
  handlersSymbol, IBaseModule, ModuleMetadata,
} from "@root/modules/app-module";

function moduleRouter (module: IBaseModule): Router {
  const router = Router({ mergeParams: true })
  const metadata = module.constructor[Symbol.metadata]?.[handlersSymbol] as ModuleMetadata | undefined
  const classHandlers = metadata?.class.reverse() ?? []
  const path = module.constructor.path
  if (!path) {
    throw new Error('No path defined for module')
  }

  if (module.get) {
    const getHandlers = metadata?.get.reverse() ?? []
    console.log(`registering GET ${path}`)
    router.get(path, ...classHandlers, ...getHandlers,  module.get)
  }

  if (module.post) {
    const postHandlers = metadata?.post.reverse() ?? []
    console.log(`registering POST ${path}`)
    router.post(path, ...classHandlers, ...postHandlers, module.post)
  }

  return router
}

export {
  moduleRouter
}
