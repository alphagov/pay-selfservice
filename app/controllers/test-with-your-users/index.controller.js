'use strict'

const paths = require('./../../paths')
const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  const pageData = {
    productsTab: false,
    dashboardLink: paths.account.formatPathFor(paths.account.dashboard.index, req.account && req.account.external_id)
  }
  response(req, res, 'dashboard/demo-service/index', pageData)
}
