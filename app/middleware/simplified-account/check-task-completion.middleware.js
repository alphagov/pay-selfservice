const { TaskAlreadyCompletedError } = require('../../errors')

module.exports = function checkTaskCompletion (task) {
  return function (req, res, next) {
    const stripeTaskProgress = req.account.connectorGatewayAccountStripeProgress
    if (stripeTaskProgress[task]) {
      next(new TaskAlreadyCompletedError(`Attempted to access task page after completion [task: ${task}]`))
    }
    next()
  }
}
