const { TaskAlreadyCompletedError, TaskAccessedOutOfSequenceError } = require('@root/errors')
const { stripeDetailsTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')
const formatSimplifiedAccountPathsFor = require('../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

module.exports = function checkTaskCompletion(task) {
  return function (req, res, next) {
    const gatewayAccountStripeProgress = req.gatewayAccountStripeProgress
    if (gatewayAccountStripeProgress[task]) {
      next(
        new TaskAlreadyCompletedError(
          `Attempted to access task page after completion [task: ${task}, serviceExternalId: ${req.service.externalId}]`
        )
      )
    }
    if (
      task === stripeDetailsTasks.governmentEntityDocument.name &&
      !gatewayAccountStripeProgress.entityDocTaskAvailable()
    ) {
      next(
        new TaskAccessedOutOfSequenceError(
          `Attempted to access task page before completing requisite tasks [task: ${task}, serviceExternalId: ${req.service.externalId}]`,
          formatSimplifiedAccountPathsFor(
            paths.simplifiedAccount.settings.stripeDetails.index,
            req.service.externalId,
            req.account.type
          )
        )
      )
    }
    next()
  }
}
