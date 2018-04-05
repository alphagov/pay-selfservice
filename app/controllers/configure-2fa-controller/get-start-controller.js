'use strict'

// NPM dependencies
const logger = require('winston')

// Local dependencies
const {response} = require('../../utils/response.js')
const router = require('../../routes.js')
const paths = require('../../paths')
const userService = require('../../services/user_service.js')
const errorView = require('../../utils/response.js').renderErrorView

const PAGE_PARAMS = {
  setUpApp: paths.user.configure2fa.setUpApp
}

module.exports = (req, res) => {
  userService.findByExternalId(req.user.externalId)
    .then(user => {
      switch (user.secondFactor) {
        case 'SMS':
          PAGE_PARAMS.usesSmsToSignIn = true;
          PAGE_PARAMS.usesAppToSignIn = false;
          break;
        case 'APP':
          PAGE_PARAMS.usesSmsToSignIn = false;
          PAGE_PARAMS.usesAppToSignIn = true;
      }
      return response(req, res, 'configure_2fa/index', PAGE_PARAMS)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Unable to retrieve user - ${err.message}`)
      errorView(req, res, 'Unable to retrieve user')
    })
}
