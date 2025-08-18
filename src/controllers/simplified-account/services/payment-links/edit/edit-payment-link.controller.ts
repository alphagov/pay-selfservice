import * as information from './info/edit-link-info.controller'
import * as amount from './amount/edit-link-amount.controller'
import * as reference from './reference/edit-link-reference.controller'
import * as metadata from './metadata'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { getProductByGatewayAccountIdAndExternalId } from '@services/products.service'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const product = await getProductByGatewayAccountIdAndExternalId(req.account.id, req.params.productExternalId)
  return response(req, res, 'simplified-account/services/payment-links/edit/overview', {
    messages: res.locals.flash?.messages ?? [],
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      req.service.externalId,
      req.account.type
    ),
    serviceMode: req.account.type,
    product: {
      name: product.name,
      details: product.description ?? 'None given',
      reference: product.referenceLabel ?? 'Created by GOV.UK Pay',
      amount: product.price ? penceToPoundsWithCurrency(product.price) : 'User can choose',
      webAddress: product.links.friendly.href,
      ...(product.metadata && {
        metadata: Object.entries(product.metadata).reduce(
          (acc, [key, value]) => {
            acc[key] = {
              value,
              link: formatServiceAndAccountPathsFor(
                paths.simplifiedAccount.paymentLinks.edit.metadata.update,
                req.service.externalId,
                req.account.type,
                product.externalId,
                key
              ),
            }
            return acc
          },
          {} as Record<string, Record<string, string>>
        ),
      }),
    },
    editInformationLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.edit.information,
      req.service.externalId,
      req.account.type,
      product.externalId
    ),
    editReferenceLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.edit.reference,
      req.service.externalId,
      req.account.type,
      product.externalId
    ),
    editAmountLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.edit.amount,
      req.service.externalId,
      req.account.type,
      product.externalId
    ),
    addReportingColumnLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.edit.metadata.add,
      req.service.externalId,
      req.account.type,
      product.externalId
    )
  })
}

export { get, information, amount, reference, metadata }
