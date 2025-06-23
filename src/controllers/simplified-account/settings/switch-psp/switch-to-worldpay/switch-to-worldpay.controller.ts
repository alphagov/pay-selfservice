import { response } from '@utils/response'
import WorldpayTasks from '@models/task-workflows/WorldpayTasks.class'
import GatewayAccountSwitchPaymentProviderRequest from '@models/gateway-account/GatewayAccountSwitchPaymentProviderRequest.class'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'
import formatPSPName from '@utils/format-PSP-name'
import { completePspSwitch } from '@services/gateway-accounts.service'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { NextFunction } from 'client-sessions'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import PaymentProviders from '@models/constants/payment-providers'
import { SESSION_KEY } from '@controllers/simplified-account/settings/worldpay-details/constants'
import _ from 'lodash'

function get(req: ServiceRequest, res: ServiceResponse) {
  _.unset(req, SESSION_KEY) // prevent duplication of service connected success banner
  const account = req.account
  const service = req.service
  const credential = account.getSwitchingCredential()
  const worldpayTasks = new WorldpayTasks(account, service.externalId, credential, 'SWITCHING')

  const context = {
    messages: res.locals?.flash?.messages ?? [],
    isMigratingWorldpayCredentials:
      account.isSwitchingToProvider(PaymentProviders.WORLDPAY) && account.paymentProvider === PaymentProviders.WORLDPAY,
    isMoto: account.allowMoto,
    currentPsp: account.paymentProvider,
    incompleteTasks: worldpayTasks.incompleteTasks(),
    tasks: worldpayTasks.tasks,
    transactionsUrl: formatAccountPathsFor(paths.account.transactions.index, account.externalId) as string,
  }
  return response(req, res, 'simplified-account/settings/switch-psp/switch-to-worldpay/index', context)
}

function post(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const account = req.account
  const service = req.service
  const user = req.user
  const targetCredential = account.getSwitchingCredential()
  const worldpayTasks = new WorldpayTasks(account, service.externalId, targetCredential, 'SWITCHING')

  if (worldpayTasks.incompleteTasks()) {
    req.flash('messages', {
      state: 'error',
      heading: 'There is a problem',
      body: 'You cannot switch providers until all required tasks are completed',
    })
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
        service.externalId,
        account.type
      )
    )
  }

  const switchProviderRequest = new GatewayAccountSwitchPaymentProviderRequest()
    .withUserExternalId(user.externalId)
    .withGatewayAccountCredentialExternalId(targetCredential.externalId)

  completePspSwitch(service.externalId, account.type, switchProviderRequest)
    .then(() => {
      req.flash('messages', {
        state: 'success',
        icon: '&check;',
        heading: `Service connected to ${formatPSPName(targetCredential.paymentProvider)}`,
        body: 'This service can now take payments',
      })
      res.redirect(
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.worldpayDetails.index,
          service.externalId,
          account.type
        )
      )
    })
    .catch((err: Error) => next(err))
}

module.exports = {
  get,
  post,
}
