process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk'

const assert = require('assert')
const portfinder = require('portfinder')
const axios = require('axios')
const winston = require('winston')

const http = require('http')
const httpProxy = require('http-proxy')

/**
 * This test actually tests if request.js honour HTTP_PROXY, NO_PROXY var's as per the documentation.
 * The reason for doing this is;
 *  we need to route requests to "Auth0" via a proxy and we use `passport-auth0.js` (https://www.npmjs.com/package/passport-auth0)
 *  and this lib uses request.js internally. We don't have control to set options manually hence making use of the env variables.
 *
 *  NOTE: Note we also use node-rest-client library in selfservice and that does not honour these vars.
 *  (Although it's used only for internal communication)
 */

describe('request.js client', function () {
  let proxiedServer, proxyServer, nonProxiedServer,
    proxiedServerUrl, proxyUrl, nonProxiedServerUrl,
    nonProxiedServerPort

  before(function () {
    // Disable logging.
    winston.level = 'none'

    // create proxied server
    portfinder.getPort(function (err, aPort) {
      if (err) { throw err }
      proxiedServer = http.createServer(function (req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.write('{"message":"server-response"}')
        res.end()
      }).listen(aPort, function () {
        // create non proxied server
        portfinder.getPort(function (err, aPort) {
          if (err) { throw err }
          nonProxiedServer = http.createServer(function (req, res) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.write('{"message":"non-proxied-server-response"}')
            res.end()
          }).listen(aPort, function () {
            // create proxy server
            portfinder.getPort(function (err, aPort) {
              if (err) { throw err }
              proxyServer = httpProxy
                .createProxyServer({ target: { host: 'localhost', port: proxiedServer.address().port } })
                .listen(aPort)
              proxyUrl = 'http://localhost:' + aPort

              proxyServer.on('proxyRes', function (proxyRes, req, res) {
                proxyRes.headers['X-Proxy-Header'] = 'touched by proxy'
              })
            })
          })

          nonProxiedServerPort = aPort
          nonProxiedServerUrl = 'http://localhost:' + aPort
        })
      })

      proxiedServerUrl = 'http://localhost:' + aPort
    })
  })

  beforeEach(function () {
    process.env.HTTP_PROXY = proxyUrl
    process.env.NO_PROXY = 'localhost:' + nonProxiedServerPort
  })

  afterEach(function () {
    delete process.env.HTTP_PROXY
    delete process.env.NO_PROXY
  })

  after(function () {
    proxyServer.close()
    proxiedServer.close()
    nonProxiedServer.close()
  })

  it('should proxy requests when HTTP_PROXY enabled', function (done) {
    axios.get(proxiedServerUrl)
      .then(function (response) {
        assert.strictEqual(response.headers['x-proxy-header'], 'touched by proxy')
        assert.strictEqual(response.data.message, 'server-response')
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('should not proxy requests for NO_PROXY hosts', function (done) {
    axios.get(nonProxiedServerUrl)
      .then(function (response) {
        assert.notStrictEqual(response.headers['x-proxy-header'], 'touched by proxy')
        assert.strictEqual(response.data.message, 'non-proxied-server-response')
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })
})
