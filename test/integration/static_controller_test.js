const path = require('path')
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
const request = require('supertest')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const _ = require('lodash')

describe('static controller', function () {
  _.each(['get', 'post', 'delete', 'put', 'patch'], function (verb) {
    it('should return an error page', function (done) {
      request(getApp())[verb]('/request-denied')
      .set('Accept', 'application/json')
      .expect(400)
      .end(done)
    })
  })
})
