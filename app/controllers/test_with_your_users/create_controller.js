'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPrototypeLink', {})
  pageData.indexPage = paths.prototyping.demoService.index
  pageData.confirmPage = paths.prototyping.demoService.confirm
  pageData.linksPage = paths.prototyping.demoService.links
  response(req, res, 'dashboard/demo-service/create', pageData)
}
