import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { searchAgreements } from '@services/agreements.service'
import { query, validationResult } from 'express-validator'
import { ACTIVE, INACTIVE, CANCELLED, CREATED } from '@models/agreements/agreement-status'
import getPagination from '@utils/simplified-account/pagination'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'

const PAGE_SIZE = 20

async function get(req: ServiceRequest, res: ServiceResponse) {
  const validations = [
    query('page').customSanitizer((value) => {
      const pageNumber = Number(value)
      if (isNaN(pageNumber) || pageNumber < 1) {
        return 1
      }
      return pageNumber
    }),
    query('status').customSanitizer((value: string) => {
      const validValues = [CREATED, ACTIVE, CANCELLED, INACTIVE]
      if (!validValues.includes(value)) {
        return undefined
      }
      return value
    }),
    query('reference')
      .trim()
      .optional({ checkFalsy: true })
      .isAlphanumeric('en-GB', { ignore: ' -_' })
      .withMessage('Reference number must contain at least one letter or number, and may also include spaces, hyphens, and underscores'),
  ]

  await Promise.all(validations.map(async (validation) => validation.run(req)))

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/services/agreements/index', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      ...await loadAgreements(req.service.externalId, req.account.id, req.account.type, Number(req.query.page)),
    })
  }

  const filters = {
    ...(req.query.status && { status: req.query.status as string }),
    ...(req.query.reference && { reference: req.query.reference as string }),
  }

  return response(req, res, 'simplified-account/services/agreements/index', {
    ...await loadAgreements(req.service.externalId, req.account.id, req.account.type, Number(req.query.page), filters),
  })
}

const loadAgreements = async (
  serviceExternalId: string,
  gatewayAccountId: number,
  gatewayAccountType: string,
  currentPage = 1,
  filters?: Record<string, string>
) => {
  const agreementsUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.agreements.index,
    serviceExternalId,
    gatewayAccountType
  )

  const results = await searchAgreements(serviceExternalId, gatewayAccountId, gatewayAccountType, currentPage, filters)

  results.agreements = results.agreements.map(agreement => {
    return {
      ...agreement,
      detailUrl: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.agreements.detail,
        serviceExternalId,
        gatewayAccountType,
        agreement.externalId
      )
    }
  })

  const totalPages = Math.ceil(results.total / PAGE_SIZE)
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages
  }

  const pagination = getPagination(
    currentPage,
    PAGE_SIZE,
    results.total,
    (pageNumber) => {
      let path = `${agreementsUrl}?page=${pageNumber}`
      if (filters && Object.keys(filters).length !== 0) {
        const filterParams = new URLSearchParams(filters).toString()
        path = `${path}&${filterParams}`
      }
      return path
    }
  )

  return {
    pagination,
    results,
    filters,
    clearRedirect: agreementsUrl,
  }
}

export { get }
