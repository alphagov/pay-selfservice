'use strict'

const baseClient = require(`./base_client/base_client`)
const GOCARDLESS_BASE_URL = `https://connect-sandbox.gocardless.com`
const BASE_URL = process.env.SELFSERVICE_BASE

module.exports = {
  getOAuthCode,
  postOAuthToken,
  redirectToGocardless
}

function getOAuthCode (params) {
  return baseClient.get({
    baseUrl: GOCARDLESS_BASE_URL,
    url: `/oauth/access_token`,
    client_id: params.clientId,
    redirect_uri: BASE_URL + `/oauth/complete`,
    scope: `read_write`,
    response_type: `code`,
    initial_view: `login`,
    access_type: `offline`,
    state: params.state
  })
}

function postOAuthToken (params) {
  return baseClient.post({
    baseUrl: GOCARDLESS_BASE_URL,
    url: `/oauth/access_token`,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: BASE_URL + `/oauth/complete`,
    scope: `read_write`,
    grant_type: `authorization_code`,
    code: params.code,
    initial_view: `login`,
    access_type: `offline`
  })
}

function redirectToGocardless (req, res, params) {
  res.redirect(`https://connect-sandbox.gocardless.com/oauth/authorize?client_id=${params.clientId}&initial_view=login&redirect_uri=https%3A%2F%2Fselfservice.test.pymnt.uk%2Foauth%2Fcomplete&response_type=code&scope=read_write&access_type=offline&state=${params.authToken}`)
}
