'use strict'

const paths = require('../../paths')
const publicAuthClient = require('../../services/clients/public_auth_client')

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
      req.flash('generic', '<h2>The API key description was successfully updated</h2>')
      res.redirect(paths.apiKeys.index)
    })
    .catch(err => {
      req.flash('genericError', `<h2>Something went wrong</h2><p>${err}</p>`)
      res.redirect(paths.apiKeys.index)
    })
}
