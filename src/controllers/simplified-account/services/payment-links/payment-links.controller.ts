import * as create from './create'
import * as edit from './edit/edit-payment-link.controller'
import * as remove from './delete/delete-payment-link.controller'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { getProducts } from '@services/products.service'
import ProductType from '@models/products/product-type'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import lodash from 'lodash'
import { CREATE_SESSION_KEY } from '@controllers/simplified-account/services/payment-links/create/constants'

async function get(req: ServiceRequest, res: ServiceResponse) {
  lodash.unset(req, CREATE_SESSION_KEY)
  const products = await getProducts(req.account.id, ProductType.ADHOC)
  return response(req, res, 'simplified-account/services/payment-links/index', {
    isAdmin: req.user.isAdminUserForService(req.service.externalId),
    messages: res.locals.flash?.messages ?? [],
    serviceMode: req.account.type,
    createLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.create, req.service.externalId, req.account.type),
    products: products
      .sort((a, b) => b.dateCreated.toMillis() - a.dateCreated.toMillis())
      .map(product => ({
        name: product.name,
        href: product.links.friendly.href,
        reference: product.referenceLabel ?? 'Created by GOV.UK Pay',
        details: product.description,
        amount: product.price ? penceToPoundsWithCurrency(product.price) : 'User can choose',
        editLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.edit, req.service.externalId, req.account.type, product.externalId),
        deleteLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.delete, req.service.externalId, req.account.type, product.externalId),
      })),
  },)
}

export {
  get,
  create,
  edit,
  remove
}
