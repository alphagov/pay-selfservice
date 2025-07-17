'use strict'

const lodash = require('lodash')

const { response } = require('@utils/response.js')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')

module.exports = (req, res) => {
  const context = {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type),
    confirmLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.confirm,  req.service.externalId, req.account.type),
    ...lodash.get(req, 'session.pageData.createPrototypeLink', {})
  }
  response(req, res, 'dashboard/demo-service/create', context)
}
