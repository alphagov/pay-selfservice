import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { getProductByExternalId } from '@services/products.service'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import ProductsClient from '@services/clients/pay/ProductsClient.class'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import createLogger from '@utils/logger'

const logger = createLogger(__filename)
const productsClient = new ProductsClient()

async function get(req: ServiceRequest, res: ServiceResponse) {
  try {
    const { productExternalId } = req.params
    const { service, account } = req

    const paymentLink = await getProductByExternalId(productExternalId)

    if (!paymentLink) {
      const redirectUrl = formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.index,
        service.externalId,
        account.type
      )
      return res.redirect(redirectUrl)
    }

    const backLinkUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      service.externalId,
      account.type
    )

    return response(req, res, 'simplified-account/services/payment-links/delete/index', {
      service,
      account,
      csrf: res.locals.csrf || req.body._csrf,
      backLink: backLinkUrl,
      paymentLink: {
        externalId: paymentLink.externalId,
        name: paymentLink.name,
        description: paymentLink.description,
        formattedPrice: paymentLink.price ? penceToPoundsWithCurrency(paymentLink.price) : 'User can choose',
        referenceLabel: paymentLink.referenceEnabled ? paymentLink.referenceLabel : 'Created by GOV.UK Pay',
      },
      cancelUrl: backLinkUrl,
      deleteUrl: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.delete,
        service.externalId,
        account.type,
        productExternalId
      ),
    })
  } catch (error) {
    logger.error('Error loading payment link for deletion', error)
    const redirectUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      req.service.externalId,
      req.account.type
    )
    return res.redirect(redirectUrl)
  }
}

async function post(req: ServiceRequest, res: ServiceResponse) {
  try {
    const { productExternalId } = req.params
    const { service, account } = req

    let errors: { summary: Array<{ href: string; text: string }> } | null = null

    if (req.body['confirm-delete'] === 'no') {
      const redirectUrl = formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.index,
        service.externalId,
        account.type
      )
      return res.redirect(redirectUrl)
    }

    const confirmDelete = req.body['confirm-delete']

    if (!confirmDelete || confirmDelete !== 'yes') {
      const paymentLink = await getProductByExternalId(productExternalId)
      const paymentLinkName = paymentLink ? paymentLink.name : 'this payment link'

      errors = {
        summary: [
          {
            href: '#confirm-delete',
            text: `Confirm if you want to delete ${paymentLinkName}`,
          },
        ],
      }
    }

    if (errors) {
      const paymentLink = await getProductByExternalId(productExternalId)

      if (!paymentLink) {
        logger.warn('Payment link not found during validation, redirecting', productExternalId)
        const redirectUrl = formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.index,
          service.externalId,
          account.type
        )
        return res.redirect(redirectUrl)
      }

      const backLinkUrl = formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.index,
        service.externalId,
        account.type
      )

      return response(req, res, 'simplified-account/services/payment-links/delete/index', {
        service,
        account,
        csrf: res.locals.csrf || req.body.csrfToken,
        errors,
        formData: req.body,
        backLink: backLinkUrl,
        paymentLink: {
          externalId: paymentLink.externalId,
          name: paymentLink.name,
          description: paymentLink.description,
          formattedPrice: paymentLink.price ? penceToPoundsWithCurrency(paymentLink.price) : 'User can choose',
          referenceLabel: paymentLink.referenceEnabled ? paymentLink.referenceLabel : 'Created by GOV.UK Pay',
        },
        cancelUrl: backLinkUrl,
        deleteUrl: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.delete,
          service.externalId,
          account.type,
          productExternalId
        ),
      })
    }

    try {
      await productsClient.products.delete(account.id, productExternalId)
      logger.info('Successfully deleted payment link', productExternalId)
    } catch (deleteError) {
      logger.error('Error calling delete method', deleteError)
      throw deleteError
    }

    req.session.pageData = {
      ...(req.session.pageData || {}),
      deleteSuccess: {
        type: 'payment-link',
        id: productExternalId,
      },
    }

    const redirectUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      service.externalId,
      account.type
    )

    return res.redirect(redirectUrl)
  } catch (error) {
    logger.error('Error deleting payment link', error)

    req.session.pageData = {
      ...(req.session.pageData || {}),
      deleteError: {
        type: 'payment-link',
        id: req.params.productExternalId,
        message: 'Unable to delete payment link. Please try again.',
      },
    }

    return res.redirect('back')
  }
}

export { get, post }
