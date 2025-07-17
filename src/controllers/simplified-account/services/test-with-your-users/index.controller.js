'use strict'

const { response } = require('@utils/response.js')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths= require('@root/paths')


module.exports = (req, res) => {
  const context = {
    productsTab: false,
    createLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.create, req.service.externalId, req.account.type),
    prototypesLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type),
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.dashboard.index, req.service.externalId, req.account.type)
  }

  return response(req, res, 'dashboard/demo-service/index', context)
}
