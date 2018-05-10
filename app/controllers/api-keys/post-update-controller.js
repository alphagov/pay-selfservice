'use strict'

// NPM dependencies
const csrf = require('csrf')

// Local dependencies
const {response} = require('../../utils/response.js')
const publicAuthClient = require('../../services/clients/public_auth_client')

module.exports = (req, res) => {
  // this does not need to be explicitly tied down to account_id
  // right now because the UUID space is big enough that no-one
  // will be able to discover other peoples' tokens to change them
  let payload = {
    token_link: req.body.token_link,
    description: req.body.description
  }

  publicAuthClient.updateToken({
    payload: payload,
    correlationId: req.correlationId
  })
    .then(publicAuthData => {
      response(req, res, 'includes/_token', {
        token: {
          'token_link': publicAuthData.token_link,
          'created_by': publicAuthData.created_by,
          'issued_date': publicAuthData.issued_date,
          'last_used': publicAuthData.last_used,
          'description': publicAuthData.description,
          'csrfToken': csrf().create(req.session.csrfSecret)
        }
      })
    })
    .catch((rejection) => {
      let responseCode = 500
      if (rejection && rejection.errorCode) {
        responseCode = rejection.errorCode
      }
      res.sendStatus(responseCode)
    })
}
