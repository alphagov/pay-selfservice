import { AuthenticatedRequest } from '@utils/types/express'
import express from 'express'
import { response } from '@utils/response'
import formatPathFor from '@utils/replace-params-in-path'
import paths from '@root/paths'
import { isBritishSummerTime } from '@utils/dates'
import { ViewMode } from '@models/view-mode/ViewMode.class'
import { getAllCardTypes } from '@services/card-types.service'
import lodash from 'lodash'
import {
  StripeStatusFilters,
  WorldpayStatusFilters,
} from '@utils/simplified-account/services/transactions/status-filters'
import PaymentProviders from '@models/constants/payment-providers'
import formattedPathFor from '@utils/simplified-account/format/format-paths-for'
import { NotFoundError } from '@root/errors'

async function get(req: AuthenticatedRequest & { viewMode: ViewMode }, res: express.Response) {
  if (!req.viewMode.hasServicesInMode) {
    throw new NotFoundError(
      `User has no services in mode [${req.viewMode.modeName}] with permission [${req.viewMode.permission}]`
    )
  }

  const cardTypes = await getAllCardTypes()

  const cardBrands = lodash.uniqBy(cardTypes, 'brand').map((card) => {
    return {
      value: card.brand,
      text: card.label === 'Jcb' ? card.label.toUpperCase() : card.label,
      selected: false,
    }
  })

  const statusFilters = req.viewMode.paymentProviders.includes(PaymentProviders.STRIPE)
    ? StripeStatusFilters
    : WorldpayStatusFilters
  const eventStates = statusFilters.map((filter) => {
    return {
      value: filter.id,
      text: filter.friendly,
      selected: false,
    }
  })

  return response(req, res, 'simplified-account/home/all-service-transactions/nosearch', {
    searchLink: formatPathFor(paths.allServiceTransactions.simplifiedAccount.index, req.viewMode.modeName),
    modeFilter: req.viewMode.modeName,
    oppositeMode: req.viewMode.oppositeModeName,
    isBST: isBritishSummerTime(),
    cardBrands: [{ value: '', text: 'Any' }, ...cardBrands],
    statuses: eventStates,
    showOppositeModeLink: req.viewMode.hasServicesInOppositeMode,
    oppositeModeLink: formattedPathFor(
      paths.allServiceTransactions.simplifiedAccount.index,
      req.viewMode.oppositeModeName
    ),
  })
}

export { get }
