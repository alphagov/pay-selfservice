'use strict'

const exchangeGoCardlessAccessCodeAccountAlreadyConnected = function () {
  return { name: 'exchangeGoCardlessAccessCodeAccountAlreadyConnected', opts: {} }
}

const redirectToGoCardlessConnectFailure = function () {
  return { name: 'redirectToGoCardlessConnectFailure', opts: {} }
}

module.exports = {
  exchangeGoCardlessAccessCodeAccountAlreadyConnected,
  redirectToGoCardlessConnectFailure
}
