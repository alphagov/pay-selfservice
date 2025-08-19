import { Router } from 'express'
import {
  BaseModule,
  handlersSymbol, ModuleMetadata, pathSymbol,
} from "@root/modules/app-module";

function moduleRouter (module: BaseModule): Router {
  console.log('metadata')
  console.log(module.constructor)
  const router = Router({ mergeParams: true })
  const metadata = module.constructor[Symbol.metadata]?.[handlersSymbol] as ModuleMetadata | undefined
  console.log(metadata)
  const classHandlers = metadata?.class.reverse() ?? []
  console.log(classHandlers)
  console.log(module.constructor.path)
  const path = module.constructor.path
  // const path = module.constructor[Symbol.metadata]?.[pathSymbol] as string | undefined
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
