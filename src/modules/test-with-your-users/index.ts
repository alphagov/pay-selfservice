
import { ConfirmModule } from './confirm.controller'
import { CreateModule } from './create.controller'
import { Router } from 'express'
import { moduleRouter } from "@root/modules/module-router";
import { DisableModule } from "./disable.controller";
import { LinksModule } from "./links.controller";
import { IndexModule } from "@root/modules/test-with-your-users/index.controller";

const router = Router({ mergeParams: true })

router.use(moduleRouter(new IndexModule()))
router.use(moduleRouter(new LinksModule()))
router.use(moduleRouter(new CreateModule()))
router.use(moduleRouter(new ConfirmModule()))
router.use(moduleRouter(new DisableModule()))

export default router
