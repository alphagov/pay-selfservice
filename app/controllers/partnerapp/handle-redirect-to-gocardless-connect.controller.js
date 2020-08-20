'use strict'

const logger = require('../../utils/logger')(__filename)
const gocardlessClient = require('../../services/clients/gocardless-connect.client')
const directDebitConnectorClient = require('../../services/clients/direct-debit-connector.client')
const REDIRECT_URI = process.env.SELFSERVICE_URL + '/oauth/complete'

exports.index = (req, res) => {
  const gatewayAccountId = req.account.externalId
  if (directDebitConnectorClient.isADirectDebitAccount(gatewayAccountId)) {
    return directDebitConnectorClient.partnerApp.createState({ gatewayAccountId, redirectUri: REDIRECT_URI })
      .then(response => {
        redirectToGoCardlessConnect(req, res, { state: response.state, redirectUri: REDIRECT_URI })
      })
      .catch(err => {
        logger.info(`'There was an error getting a state token from Direct Debit Connector' ${JSON.stringify(err)}`)
        req.flash('genericError', 'Something went wrong. Please try again or contact support.')
        res.redirect('/')
      })
  } else {
    res.status(404)
    res.render('404')
  }
}

function redirectToGoCardlessConnect (req, res, params) {
  gocardlessClient.startOAuth(
    req,
    res,
    {
      goCardlessOauthUrl: getGoCardlessOAuthUrl(req.account),
      clientId: getGoCardlessOAuthClientId(req.account),
      state: params.state,
      redirectUri: params.redirectUri
    })
}

function getGoCardlessOAuthUrl (gatewayAccount) {
  return (gatewayAccount.type === 'test') ? process.env.GOCARDLESS_TEST_OAUTH_BASE_URL : process.env.GOCARDLESS_LIVE_OAUTH_BASE_URL
}

function getGoCardlessOAuthClientId (gatewayAccount) {
  return (gatewayAccount.type === 'test') ? process.env.GOCARDLESS_TEST_CLIENT_ID : process.env.GOCARDLESS_LIVE_CLIENT_ID
}
