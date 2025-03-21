require('@test/test-helpers/serialize-mock.js')
const request = require('supertest')
const getApp = require('@root/server').getApp

describe('The /healthcheck endpoint returned json', function () {
  it('should return 200', function (done) {
    const expectedResponse = { ping: { healthy: true } }
    request(getApp())
      .get('/healthcheck')
      .set('Accept', 'application/json')
      .expect(200)
      .expect(function (res) {
        const response = JSON.parse(res.text)
        expectedResponse.ping.healthy.should.equal(response.ping.healthy)
      }).end(done)
  })
})
