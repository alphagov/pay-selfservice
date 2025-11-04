import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { getProductByGatewayAccountIdAndExternalId, updateProduct } from '@services/products.service'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { NotFoundError } from '@root/errors'
import { NextFunction } from 'express'
import Product from '@models/products/Product.class'
import { paymentLinkSchema } from '@utils/simplified-account/validation/payment-link.schema'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { ProductUpdateRequestBuilder } from '@models/products/ProductUpdateRequest.class'
import lodash from 'lodash'

async function get(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const product = await getProductByGatewayAccountIdAndExternalId(req.account.id, req.params.productExternalId)
  try {
    checkKeyExistsOnProductMetadata(product, req)
    return response(req, res, 'simplified-account/services/payment-links/edit/metadata', {
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.edit.index,
        req.service.externalId,
        req.account.type,
        product.externalId
      ),
      serviceMode: req.account.type,
      isWelsh: product.language === 'cy',
      formValues: {
        reportingColumn: req.params.metadataKey,
        cellContent: product.metadata[req.params.metadataKey],
      },
      productName: product.name,
    })
  } catch (error) {
    next(error)
  }
}

interface EditLinkMetadataBody {
  action: 'edit' | 'delete'
  reportingColumn: string
  cellContent: string
}

async function post(req: ServiceRequest<EditLinkMetadataBody>, res: ServiceResponse, next: NextFunction) {
  const product = await getProductByGatewayAccountIdAndExternalId(req.account.id, req.params.productExternalId)

  try {
    checkKeyExistsOnProductMetadata(product, req)

    if (req.body.action === 'edit') {
      const validations = [
        paymentLinkSchema.metadata.columnHeader.edit.validate(product.metadata, req.params.metadataKey),
        paymentLinkSchema.metadata.cellContent.validate,
      ]

      for (const validation of validations) {
        await validation.run(req)
      }

      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        const formattedErrors = formatValidationErrors(errors)
        return response(req, res, 'simplified-account/services/payment-links/edit/metadata', {
          errors: {
            summary: formattedErrors.errorSummary,
            formErrors: formattedErrors.formErrors,
          },
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.edit.index,
            req.service.externalId,
            req.account.type,
            product.externalId
          ),
          serviceMode: req.account.type,
          isWelsh: product.language === 'cy',
          formValues: req.body,
        })
      }

      const updatedMetadata = {
        ...lodash.omit(product.metadata, req.params.metadataKey),
        [req.body.reportingColumn]: req.body.cellContent,
      }

      const productUpdateRequest = ProductUpdateRequestBuilder.fromProduct(product).setMetadata(updatedMetadata).build()

      await updateProduct(req.account.id, product.externalId, productUpdateRequest)

      req.flash('messages', {
        state: 'success',
        icon: '&check;',
        heading: 'Reporting columns updated',
      })
    } else if (req.body.action === 'delete') {
      const updatedMetadata = lodash.omit(product.metadata, req.params.metadataKey)

      const productUpdateRequest = ProductUpdateRequestBuilder.fromProduct(product).setMetadata(updatedMetadata).build()

      await updateProduct(req.account.id, product.externalId, productUpdateRequest)

      req.flash('messages', {
        state: 'success',
        icon: '&check;',
        heading: `Reporting column '${req.params.metadataKey}' deleted`,
      })
    }

    res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.edit.index,
        req.service.externalId,
        req.account.type,
        product.externalId
      )
    )
  } catch (error) {
    next(error)
  }
}

function checkKeyExistsOnProductMetadata(
  product: Product,
  req: ServiceRequest<EditLinkMetadataBody>
): asserts product is Product & {
  metadata: NonNullable<Record<string, string>>
} {
  if (!Object.keys(product.metadata ?? {}).includes(req.params.metadataKey)) {
    throw new NotFoundError(
      `Metadata key was not found on product [product_external_id: ${product.externalId}, service_external_id: ${req.service.externalId}]`
    )
  }
}

export { get, post }
