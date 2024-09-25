'use strict'

// const { response } = require('../../utils/response')
const responses = require('../../utils/response')

function getServiceNamePage (req, res) {
  return responses.response(req, res, 'settings/service-name')
}

module.exports = {
  getServiceNamePage: getServiceNamePage
}
