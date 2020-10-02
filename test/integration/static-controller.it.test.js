var path = require('path')
require(path.join(__dirname, '/../test-helpers/serialize-mock.js'))
var request = require('supertest')
var getApp = require(path.join(__dirname, '/../../server.js')).getApp
var _ = require('lodash')

describe('static controller', () => {
  _.each(['get', 'post', 'delete', 'put', 'patch'], function (verb) {
    it('should return an error page', done => {
      request(getApp())[verb]('/request-denied')
        .set('Accept', 'application/json')
        .expect(400)
        .end(done)
    })
  })
})
