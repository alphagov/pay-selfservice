const request = require('supertest')
const getApp = require('@root/server').getApp
const _ = require('lodash')
const { paths } = require('@root/routes')

describe('static controller', function () {
  _.each(['get', 'delete', 'patch'], function (verb) {
    it(`should return an error page [${verb}]`, function (done) {
      request(getApp())[verb]('/request-denied')
        .set('Accept', 'application/json')
        .expect(400)
        .end(done)
    })
  })

  // CSRF middleware error handling will automatically redirect the request to the logout page in the event that a csrf token is missing for POST and PUT
  _.each(['post', 'put'], function (verb) {
    it(`should return logout page [${verb}]`, function (done) {
      request(getApp())[verb]('/request-denied')
        .set('Accept', 'application/json')
        .expect(302)
        .expect('Location', paths.user.logOut)
        .end(done)
    })
  })
})
