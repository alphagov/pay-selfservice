import { Router } from 'express'
import testWithYourUsers from '@root/modules/service/test-with-your-users'

const modularRouter = Router({ mergeParams: true })

modularRouter.use(testWithYourUsers)

export { modularRouter }
