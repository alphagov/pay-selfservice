'use strict'

const paths = require('../../paths')
const publicAuthClient = require('../../services/clients/public-auth.client')
const logger = require('../../utils/logger')(__filename)

module.exports = (req, res) => {
  // this does not need to be explicitly tied down to account_id
  // right now because the UUID space is big enough that no-one
  // will be able to discover other peoples' tokens to change them
  const payload = {
    token_link: req.body.token_link,
    description: req.body.description
  }

  publicAuthClient.updateToken({
    payload: payload,
    correlationId: req.correlationId
  })
    .then(() => {
      req.flash('generic', 'The API key description was successfully updated')
      res.redirect(paths.apiKeys.index)
    })
    .catch(error => {
      logger.error('Error updating API key description', { error })
      req.flash('genericError', 'Something went wrong. Please try again or contact support.')
      res.redirect(paths.apiKeys.index)
    })
}
