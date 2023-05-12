const http = require('http')
const https = require('https')
const url = require('url')

const logger = require('../../utils/logger')(__filename)

class Stream {
  constructor (dataCallback, successCallback, errorCallback, headers) {
    this.dataCallback = dataCallback
    this.successCallback = successCallback
    this.errorCallback = errorCallback
    this.headers = headers || { Accept: 'text/csv', 'Content-Type': 'application/json' }
  }

  request (targetUrl) {
    const parsed = url.parse(targetUrl)
    const options = {
      path: `${parsed.pathname}${parsed.search}`,
      host: parsed.hostname,
      port: parsed.port,
      headers: this.headers
    }

    const request = this._getClient(parsed.protocol).request(options, (response) => {
      response.on('data', this.dataCallback)
      response.on('end', this.successCallback)
    })
    request.on('error', this.errorCallback)

    logger.info(`Stream client request to ${targetUrl}`, {
      ...options
    })
    request.end()
  }

  _getClient (protocol) {
    return protocol && protocol.includes('https') ? https : http
  }
}

module.exports = Stream
