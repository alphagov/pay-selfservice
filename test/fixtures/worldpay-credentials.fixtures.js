function checkValidWorldpayCredentialsRequest (opts = {}) {
  return {
    gatewayAccountId: opts.gatewayAccountId || 333,
    payload: {
      merchant_id: opts.merchant_id || 'a-merchant-id',
      username: opts.username || 'a-username',
      password: opts.password || 'a-password'
    }
  }
}

function checkValidWorldpayCredentialsResponse (opts = {}) {
  return {
    result: opts.result || 'valid'
  }
}
module.exports = {
  checkValidWorldpayCredentialsRequest, checkValidWorldpayCredentialsResponse
}
