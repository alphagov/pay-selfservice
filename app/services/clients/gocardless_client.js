'use strict'

// const REDIRECT_URI = process.env.SELFSERVICE_BASE + '/oauth/complete'
const REDIRECT_URI = 'https://selfservice.test.pymnt.uk/oauth/complete'

module.exports = {
  redirectToGocardless
}

/**
 * Will redirect the request to initial step in the OAuth journey for GoCardless
 * @param req                       {Object} The incoming request
 * @param res                       {Object} The response
 * @param params                    {Object}
 * @param params.gocardlessOauthUrl {String} The base URL for GoCardless OAuth connect
 * @param params.clientId           {String} The client id that GoCardless provided to GOV.UK Pay when creating a Partner app
 * @param params.state              {String} An extra parameter that GoCardless will send back. Can be a CSRF token, for security
 */
function redirectToGocardless (req, res, params) {
  res.redirect(`${params.gocardlessOauthUrl}/oauth/authorize?client_id=${params.clientId}&initial_view=login&redirect_uri=${REDIRECT_URI}&response_type=code&scope=read_write&access_type=offline&state=${params.state}`)
}
