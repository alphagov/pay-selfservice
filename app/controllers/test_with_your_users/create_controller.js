'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPrototypeLink', {})
  response(req, res, 'dashboard/demo-service/create', pageData)
}
