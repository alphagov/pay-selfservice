'use strict'

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

const PAGE_PARAMS = {
  productsTab: false,
  createPage: paths.prototyping.demoService.create,
  indexPage: paths.prototyping.demoService.index,
  linksPage: paths.prototyping.demoService.links
}

module.exports = (req, res) => response(req, res, 'dashboard/demo-service/index', PAGE_PARAMS)
