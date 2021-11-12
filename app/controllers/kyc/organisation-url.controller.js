'use strict'

const { response } = require('../../utils/response')

function getUrl (req, res) {
  return response(req, res, 'kyc/organisation-url', {})
}

function updateUrl (req, res) {
  return response(req, res, 'kyc/organisation-url', {})
}

module.exports = {
  getUrl,
  updateUrl
}
