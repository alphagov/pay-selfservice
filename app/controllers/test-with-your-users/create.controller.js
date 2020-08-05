'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPrototypeLink', {})
  response(req, res, 'dashboard/demo-service/create', pageData)
}
