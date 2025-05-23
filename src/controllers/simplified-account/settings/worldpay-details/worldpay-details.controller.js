const { response } = require('@utils/response')
const WorldpayTasks = require('@models/WorldpayTasks.class')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

function get (req, res) {
  const worldpayTasks = new WorldpayTasks(req.account, req.service.externalId)

  const context = {
    tasks: worldpayTasks.tasks,
    incompleteTasks: worldpayTasks.incompleteTasks(),
    messages: res.locals.flash?.messages ?? [],
    providerSwitchEnabled: req.account.providerSwitchEnabled
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
          req.service.externalId, req.account.type),
        merchantCode: req.account.getCurrentCredential().credentials.recurringCustomerInitiated.merchantCode,
        username: req.account.getCurrentCredential().credentials.recurringCustomerInitiated.username
      }, {
        title: 'Recurring merchant initiated transaction (MIT) credentials',
        href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.recurringMerchantInitiated,
          req.service.externalId, req.account.type),
        merchantCode: req.account.getCurrentCredential().credentials.recurringMerchantInitiated.merchantCode,
        username: req.account.getCurrentCredential().credentials.recurringMerchantInitiated.username
      }]
    } else {
      context.answers.tasksWithMerchantCodeAndUsername = [{
        title: 'Account credentials',
        href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
          req.service.externalId, req.account.type),
        merchantCode: req.account.getCurrentCredential().credentials.oneOffCustomerInitiated.merchantCode,
        username: req.account.getCurrentCredential().credentials.oneOffCustomerInitiated.username
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
