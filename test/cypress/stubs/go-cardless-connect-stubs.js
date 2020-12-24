'use strict'

const goCardlessConnectFixtures = require('../../fixtures/go-cardless-connect.fixtures')
const { stubBuilder } = require('./stub-builder')

function exchangeGoCardlessAccessCodeAccountAlreadyConnected () {
  const path = '/v1/api/gocardless/partnerapp/tokens'
  return stubBuilder('POST', path, 400, {
    response: goCardlessConnectFixtures.exchangeAccessTokenAccountAlreadyConnectedResponse()
  })
}

function redirectToGoCardlessConnectFailure () {
  const path = '/oauth/authorize'
  return stubBuilder('GET', path, 500, {
    responseHeaders: {}
  })
}

module.exports = {
  exchangeGoCardlessAccessCodeAccountAlreadyConnected,
  redirectToGoCardlessConnectFailure
}
