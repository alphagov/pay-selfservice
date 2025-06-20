const { response } = require('@utils/response')
const WorldpayTasks = require('@models/task-workflows/WorldpayTasks.class')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

function get (req, res) {
  const credential = req.account.getCurrentCredential()
  const worldpayTasks = new WorldpayTasks(req.account, req.service.externalId, credential)

  const context = {
    currentPsp: req.account.paymentProvider,
    tasks: worldpayTasks.tasks,
    incompleteTasks: worldpayTasks.incompleteTasks(),
    messages: res.locals.flash?.messages ?? [],
    providerSwitchEnabled: req.account.providerSwitchEnabled,
    ...(req.account.providerSwitchEnabled && {
      switchingPsp: req.account.getSwitchingCredential().paymentProvider
    })
  }

  if (!worldpayTasks.incompleteTasks()) {
    context.answers = {
      worldpay3dsFlex: req.account.worldpay3dsFlex && {
        href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.flexCredentials,
          req.service.externalId, req.account.type),
        organisationalUnitId: req.account.worldpay3dsFlex.organisationalUnitId,
        issuer: req.account.worldpay3dsFlex.issuer
      }
    }
    if (worldpayTasks.hasRecurringTasks()) {
      context.answers.tasksWithMerchantCodeAndUsername = [{
        title: 'Recurring customer initiated transaction (CIT) credentials',
        href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.recurringCustomerInitiated,
          req.service.externalId, req.account.type, credential.externalId),
        merchantCode: credential.credentials.recurringCustomerInitiated.merchantCode,
        username: credential.credentials.recurringCustomerInitiated.username
      }, {
        title: 'Recurring merchant initiated transaction (MIT) credentials',
        href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.recurringMerchantInitiated,
          req.service.externalId, req.account.type, credential.externalId),
        merchantCode: credential.credentials.recurringMerchantInitiated.merchantCode,
        username: credential.credentials.recurringMerchantInitiated.username
      }]
    } else {
      context.answers.tasksWithMerchantCodeAndUsername = [{
        title: 'Account credentials',
        href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
          req.service.externalId, req.account.type, credential.externalId),
        merchantCode: credential.credentials.oneOffCustomerInitiated.merchantCode,
        username: credential.credentials.oneOffCustomerInitiated.username
      }]
    }
  }

  return response(req, res, 'simplified-account/settings/worldpay-details/index', context)
}

module.exports = {
  get,
  oneOffCustomerInitiatedCredentials: require('./credentials/worldpay-credentials.controller'),
  flexCredentials: require('./flex-credentials/worldpay-flex-credentials.controller'),
  recurringCustomerInitiatedCredentials: require('./recurring-customer-initiated-credentials/recurring-customer-initiated-credentials.controller'),
  recurringMerchantInitiatedCredentials: require('./recurring-merchant-initiated-credentials/recurring-merchant-initiated-credentials.controller')
}
