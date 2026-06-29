import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { dashboardTransactionSummary } from '@services/transactions.service'
import {
  DT_FULL,
  getPeriodUKDateTimeRange,
  Period,
  TRANSACTION_FILTER_PERIODS,
} from '@utils/simplified-account/services/dashboard/datetime-utils'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'
import formatServicePathsFor from '@utils/format-service-paths-for'
import {
  getAccountStatus,
  getActionsToDisplay,
  getConfigurePSPAccountLink,
  getGoLiveStatus,
  getTelephonePaymentLink,
  isWorldpayTestService,
  possibleActions,
} from '@utils/simplified-account/services/dashboard/actions-utils'
import createLogger from '@utils/logger'
import type { DateTime } from 'luxon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { GatewayAccountType } from '@models/gateway-account/gateway-account-type'

const logger = createLogger(__filename)

async function get(req: ServiceRequest, res: ServiceResponse) {
  const currentPeriod = (req.query.period as Period) ?? Period.TODAY
  const { start, end } = getPeriodUKDateTimeRange(currentPeriod)

  const searchParams = new URLSearchParams()
  searchParams.append('dateFilter', TRANSACTION_FILTER_PERIODS.has(currentPeriod) ? currentPeriod : 'custom-range')

  if (start && end) {
    searchParams.append('fromDate', start.toFormat('dd/MM/yyyy'))
    searchParams.append('fromTime', start.toFormat('HH:mm:ss'))
    searchParams.append('toDate', end.toFormat('dd/MM/yyyy'))
    searchParams.append('toTime', end.toFormat('HH:mm:ss'))
  }

  req.serviceView.links.transactions.withDefaultSearchParams(searchParams)

  const transactionsPeriodQueryParams = searchParams.toString()

  const humanDates = {
    start: start?.toLocaleString(DT_FULL),
    end: end?.toLocaleString(DT_FULL),
  }

  const agentInitiatedMotoPaymentLink = await getTelephonePaymentLink(req.user, req.service, req.account.id)

  return response(req, res, 'simplified-account/services/dashboard/index', {
    messages: res.locals.flash?.messages ?? [],
    currentPeriod,
    activity: start && end ? await getActivity(req.account.id, start, end) : {},
    humanDates,
    possibleActions,
    dashboardActions: getActionsToDisplay(
      req.service,
      req.account,
      req.user,
      agentInitiatedMotoPaymentLink !== undefined
    ),
    goLiveStatus: getGoLiveStatus(req.service),
    accountStatus: await getAccountStatus(req.account, req.service),
    isWorldpayTestService: isWorldpayTestService(req.service, req.account),
    links: {
      activity: {
        payments: `${formatAccountPathsFor(paths.account.transactions.index, req.account.externalId)}?state=Success&${transactionsPeriodQueryParams}`,
        refunds: `${formatAccountPathsFor(paths.account.transactions.index, req.account.externalId)}?state=Refund+success&${transactionsPeriodQueryParams}`,
        net: `${formatAccountPathsFor(paths.account.transactions.index, req.account.externalId)}?state=Success&state=Refund+success&${transactionsPeriodQueryParams}`,
      },
      dashboardActions: {
        switchMode:
          req.account.type === GatewayAccountType.LIVE
            ? formatServiceAndAccountPathsFor(
                paths.simplifiedAccount.enterSandboxMode.index,
                req.service.externalId,
                GatewayAccountType.LIVE
              )
            : formatServiceAndAccountPathsFor(
                paths.simplifiedAccount.exitSandboxMode.index,
                req.service.externalId,
                GatewayAccountType.TEST
              ),
        demoPayment: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.demoPayment.index,
          req.service.externalId,
          req.account.type
        ),
        demoPaymentLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.testWithYourUsers.index,
          req.service.externalId,
          req.account.type
        ),
        createPaymentLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.create,
          req.service.externalId,
          req.account.type
        ),
        managePaymentLinks: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.index,
          req.service.externalId,
          req.account.type
        ),
        telephonePaymentLink: agentInitiatedMotoPaymentLink,
        requestPspTestAccount: formatServicePathsFor(paths.service.requestPspTestAccount, req.service.externalId),
        requestLiveAccount: formatServicePathsFor(paths.service.requestToGoLive.index, req.service.externalId),
        configurePSPAccount: getConfigurePSPAccountLink(req.service, req.account),
        providerChangeToAdyen: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.switchPsp.switchToAdyen.providerChangeToAdyen,
          req.service.externalId,
          req.account.type
        ),
      },
    },
  })
}

const getActivity = async (gatewayAccountId: number, start: DateTime, end: DateTime) => {
  let activity = {
    error: false,
  }

  try {
    activity = {
      ...activity,
      ...(await dashboardTransactionSummary(gatewayAccountId, start.toISO()!, end.toISO()!)),
    }
  } catch (err) {
    activity.error = true
    logger.error('Calling ledger to get transactions summary failed', err)
  }

  return activity
}

export { get }
