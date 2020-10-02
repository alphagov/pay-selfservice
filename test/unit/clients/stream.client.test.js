'use strict'
const http = require('http')
const https = require('https')
const Stream = require('../../../app/services/clients/stream.client')

describe('Streaming client', () => {
  it('gets http client for non secure protocol', () => {
    const client = new Stream()
    const selected = client._getClient('http://some-url.com/path')
    expect(selected).toEqual(http)
  })

  it('gets https client for secure url', () => {
    const client = new Stream()
    const selected = client._getClient('https://some-url.com/path')
    expect(selected).toEqual(https)
  })

  it('gets http for unspecified protocol url', () => {
    const client = new Stream()
    const selected = client._getClient('www.some-url.com/path')
    expect(selected).toEqual(http)
  })
})
