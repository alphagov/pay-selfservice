'use strict'

const baseClient = require(`./base_client/base_client`)
const GOCARDLESS_OAUTH_BASE_URL = process.env.GOCARDLESS_OAUTH_BASE_URL
const REDIRECT_URI = process.env.SELFSERVICE_BASE + '/oauth/complete'

module.exports = {
  postOAuthToken,
  redirectToGocardless
}

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

function redirectToGocardless (req, res, params) {
  res.redirect(`${GOCARDLESS_OAUTH_BASE_URL}/oauth/authorize?client_id=${params.clientId}&initial_view=login&redirect_uri=https%3A%2F%2Fselfservice.test.pymnt.uk%2Foauth%2Fcomplete&response_type=code&scope=read_write&access_type=offline&state=${params.state}`)
}
