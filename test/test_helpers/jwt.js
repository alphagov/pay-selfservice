var jwt = require('jsonwebtoken')

function createToken (requestMethod, requestPath, secret, clientId, requestBody) {
  return jwt.sign(
    {
      iss: clientId,
      iat: Math.round(Date.now() / 1000)
    },
    secret,
    {
      headers: {typ: 'JWT', alg: 'HS256'}
    }
  )
}

module.exports = createToken
