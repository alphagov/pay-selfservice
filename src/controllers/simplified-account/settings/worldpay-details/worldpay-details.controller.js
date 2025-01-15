const { response } = require('@utils/response')
const { WorldpayTasks } = require('@models/WorldpayTasks.class')

function get (req, res) {
  const worldpayTasks = new WorldpayTasks(req.account, req.service.externalId)

  const context = {
    tasks: worldpayTasks.tasks,
    incompleteTasks: worldpayTasks.incompleteTasks,
    messages: res.locals?.flash?.messages ?? []
  }
  return response(req, res, 'simplified-account/settings/worldpay-details/index', context)
}

module.exports.get = get
module.exports.worldpayCredentials = require('./credentials/worldpay-credentials.controller')
