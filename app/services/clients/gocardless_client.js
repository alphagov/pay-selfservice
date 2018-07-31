'use strict'

const baseClient = require(`./base_client/base_client`)
const GOCARDLESS_OAUTH_BASE_URL = process.env.GOCARDLESS_OAUTH_BASE_URL
const REDIRECT_URI = process.env.SELFSERVICE_BASE + '/oauth/complete'

module.exports = {
  postOAuthToken,
  redirectToGocardless
}

/**
 * Exchanges a GoCardless access code with a permanent access token
 * @param {Object} params
 * @param {String} params.clientId      The GOV.UK Pay client id that is provided by GoCardless when creating a Partner app
 * @param {String} params.clientSecret  The GOV.UK Pay client secret that is provided by GoCardless when creating a Partner app
 * @param {String} params.code          The code that is provided by GoCardless when a Merchant links its account to Pay
 * @returns {Promise}
 */
function postOAuthToken (params) {
  return baseClient.post({
    baseUrl: GOCARDLESS_OAUTH_BASE_URL,
    url: `/oauth/access_token`,
    json: true,
    body: {
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: `authorization_code`,
      code: params.code
    },
    description: 'Exchange GoCardless code for token',
    service: 'GoCardless'
  })
}

/**
 * Will redirect the request to initial step in the OAuth journey for GoCardless
 * @param req             {Object} The incoming request
 * @param res             {Object} The response
 * @param params          {Object}
 * @param params.clientId {String} The client id that GoCardless provided to GOV.UK Pay when creating a Partner app
 * @param params.state    {String} An extra parameter that GoCardless will send back. Can be a CSRF token, for security
 */
function redirectToGocardless (req, res, params) {
  res.redirect(`${GOCARDLESS_OAUTH_BASE_URL}/oauth/authorize?client_id=${params.clientId}&initial_view=login&redirect_uri=${REDIRECT_URI}&response_type=code&scope=read_write&access_type=offline&state=${params.state}`)
}
