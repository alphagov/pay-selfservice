const { response } = require('@utils/response')
const WorldpayTasks = require('@models/WorldpayTasks.class')
const GatewayAccountSwitchPaymentProviderRequest = require('@models/gateway-account/GatewayAccountSwitchPaymentProviderRequest.class')
const formatAccountPathsFor = require('@utils/format-account-paths-for')
const paths = require('@root/paths')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const formatPSPName = require('@utils/format-PSP-name')
const { postSwitchPSP } = require('@services/gateway-accounts.service')

function get (req, res) {
  const account = req.account
  const service = req.service
  const worldpayTasks = new WorldpayTasks(account, service.externalId, true)

  const context = {
    messages: res.locals?.flash?.messages ?? [],
    isMoto: account.allowMoto,
    currentPsp: account.paymentProvider,
    incompleteTasks: worldpayTasks.incompleteTasks(),
    tasks: worldpayTasks.tasks,
    transactionsUrl: formatAccountPathsFor(paths.account.transactions.index, account.externalId)
  }
  return response(req, res, 'simplified-account/settings/switch-psp/switch-to-worldpay/index', context)
}

function post (req, res, next) {
  const account = req.account
  const service = req.service
  const user = req.user
  const targetCredential = account.getSwitchingCredential()
  const worldpayTasks = new WorldpayTasks(account, service.externalId)

  if (worldpayTasks.incompleteTasks()) {
    req.flash('messages', { state: 'error', heading: 'There is a problem', body: 'You cannot switch providers until all required tasks are completed' })
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index, service.externalId, account.type))
  }

  const switchProviderRequest = new GatewayAccountSwitchPaymentProviderRequest()
    .withUserExternalId(user.externalId)
    .withGatewayAccountCredentialExternalId(targetCredential.externalId)

  postSwitchPSP(service.externalId, account.type, switchProviderRequest)
    .then(() => {
      req.flash('messages', { state: 'success', icon: '&check;', heading: `Service connected to ${formatPSPName(targetCredential.paymentProvider)}`, body: 'This service can now take payments' })
      res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, service.externalId, account.type))
    })
    .catch(err => next(err))
}

module.exports = {
  get,
  post,
  oneOffCustomerInitiated: require('./add-worldpay-credentials.controller'),
  flexCredentials: require('./add-flex-credentials.controller'),
}
