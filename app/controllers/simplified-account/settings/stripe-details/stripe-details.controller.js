const { response } = require('../../../../utils/response')
const friendlyStripeTasks = require('../../../../utils/simplified-account/settings/stripe-details/tasks')

async function get (req, res) {
  const account = req.account
  const service = req.service
  const stripeDetailsTasks = friendlyStripeTasks(account, service)
  return response(req, res, 'simplified-account/settings/stripe-details/index', {
    messages: res.locals?.flash?.messages ?? [],
    stripeDetailsTasks,
    incompleteTasks: Object.values(stripeDetailsTasks).some(task => task.status === false)
  })
}

module.exports.get = get
