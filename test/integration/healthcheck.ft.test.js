var path = require('path')
require(path.join(__dirname, '/../test-helpers/serialize-mock.js'))
var request = require('supertest')
var getApp = require(path.join(__dirname, '/../../server.js')).getApp

describe('The /healthcheck endpoint returned json', () => {
  it('should return 200', done => {
    var expectedResponse = { 'ping': { 'healthy': true } }
    request(getApp())
      .get('/healthcheck')
      .set('Accept', 'application/json')
      .expect(200)
      .expect(function (res) {
        var response = JSON.parse(res.text)
        expect(expectedResponse.ping.healthy).toBe(response.ping.healthy)
      }).end(done)
  })
})
