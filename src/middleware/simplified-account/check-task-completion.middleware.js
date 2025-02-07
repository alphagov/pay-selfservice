const { TaskAlreadyCompletedError, TaskAccessedOutOfSequenceError } = require('@root/errors')
const {
  stripeDetailsTasks,
  canStartGovernmentEntityDocument
} = require('@utils/simplified-account/settings/stripe-details/tasks')

module.exports = function checkTaskCompletion (task) {
  return function (req, res, next) {
    const stripeTaskProgress = req.gatewayAccountStripeProgress
    if (stripeTaskProgress[task]) {
      next(new TaskAlreadyCompletedError(`Attempted to access task page after completion [task: ${task}, serviceExternalId: ${req.service.externalId}]`))
    }
    if (task === stripeDetailsTasks.governmentEntityDocument.name && !canStartGovernmentEntityDocument(stripeTaskProgress)) {
      next(new TaskAccessedOutOfSequenceError(`Attempted to access task page before completing requisite tasks [task: ${task}, serviceExternalId: ${req.service.externalId}]`))
    }
    next()
  }
}
