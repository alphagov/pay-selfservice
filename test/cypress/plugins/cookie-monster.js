const session = require('client-sessions')
const crypto = require('crypto')

function getCookie (cookieName, secretKey, val) {
  const encryptionKey = deriveKey(secretKey, 'cookiesession-encryption')
  const signatureKey = deriveKey(secretKey, 'cookiesession-signature')
  const encryptedCookie = session.util.encode({
    cookieName,
    encryptionKey,
    encryptionAlgorithm: 'aes-256-cbc',
    signatureKey
  }, val)
  return encryptedCookie
}

function forceBuffer (binaryOrBuffer) {
  if (Buffer.isBuffer(binaryOrBuffer)) {
    return binaryOrBuffer
  } else {
    return Buffer.from(binaryOrBuffer, 'binary')
  }
}

function deriveKey (master, type) {
  // eventually we want to use HKDF. For now we'll do something simpler.
  const hmac = crypto.createHmac('sha256', master)
  hmac.update(type)
  return forceBuffer(hmac.digest())
}

module.exports = {
  getCookie
}
