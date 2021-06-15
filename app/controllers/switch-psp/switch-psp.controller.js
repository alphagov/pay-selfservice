'use strict'
const { response } = require('../../utils/response')
const switchTasks = require('./switch-tasks.service')
const { getSwitchingCredential } = require('../../utils/credentials')

function switchPSPPage (req, res, next) {
  try {
    const targetCredential = getSwitchingCredential(req.account)
    const taskList = switchTasks.getStatusesFor(targetCredential, req.account)

    response(req, res, 'switch-psp/switch-psp', { targetCredential, taskList })
  } catch (error) {
    next(error)
  }
}

module.exports = { switchPSPPage }
