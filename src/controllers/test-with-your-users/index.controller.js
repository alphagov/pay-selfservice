'use strict'

const { response } = require('../../utils/response.js')

const PAGE_PARAMS = {
  productsTab: false
}

module.exports = (req, res) => response(req, res, 'dashboard/demo-service/index', PAGE_PARAMS)
