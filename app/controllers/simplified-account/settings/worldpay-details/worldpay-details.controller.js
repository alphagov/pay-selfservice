const { response } = require('@utils/response')
const { WorldpayTasks } = require('@models/WorldpayTasks.class')

function get (req, res) {
  const worldpayTasks = new WorldpayTasks(req.account)

  const context = {
    tasks: worldpayTasks.tasks,
    incompleteTasks: worldpayTasks.incompleteTasks
  }
  return response(req, res, 'simplified-account/settings/worldpay-details/index', context)
}

module.exports.get = get
