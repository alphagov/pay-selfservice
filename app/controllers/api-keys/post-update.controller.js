'use strict'

// Local dependencies
const paths = require('../../paths')
const publicAuthClient = require('../../services/clients/public-auth.client')

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
    .catch(err => {
      req.flash('genericError', `<h2>Something went wrong</h2><p>${err}</p>`)
      res.redirect(paths.apiKeys.index)
    })
}
