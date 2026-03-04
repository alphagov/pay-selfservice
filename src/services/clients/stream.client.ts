import http from 'http'
import https from 'https'
import url from 'url'

import logger from '@utils/logger'
import { OutgoingHttpHeaders } from 'node:http'
const LOGGER = logger(__filename)

type Callback = () => void
type DataCallback = (chunk: unknown) => void

class Stream {
  private readonly dataCallback: DataCallback
  private readonly successCallback: Callback
  private readonly errorCallback: Callback
  private readonly headers: OutgoingHttpHeaders

  constructor(
    dataCallback: DataCallback,
    successCallback: Callback,
    errorCallback: Callback,
    headers?: OutgoingHttpHeaders
  ) {
    this.dataCallback = dataCallback
    this.successCallback = successCallback
    this.errorCallback = errorCallback
    this.headers = headers ?? { Accept: 'text/csv', 'Content-Type': 'application/json' }
  }

  request(targetUrl: string) {
    const parsed = url.parse(targetUrl) // TODO update this as url.parse is deprecated
    const options = {
      path: `${parsed.pathname}${parsed.search}`,
      host: parsed.hostname,
      port: parsed.port,
      headers: this.headers,
    }

    const request = this._getClient(parsed.protocol).request(options, (response) => {
      response.on('data', this.dataCallback)
      response.on('end', this.successCallback)
    })
    request.on('error', this.errorCallback)

    LOGGER.info(`Stream client request to ${targetUrl}`, {
      ...options,
    })
    request.end()
  }

  _getClient(protocol?: string | null) {
    return protocol?.includes('https') ? https : http
  }
}

export = Stream
