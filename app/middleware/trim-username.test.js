const req = { body: { username: ' iggy@foo.com ' } }
const trimEmail = require('./trim-username')
const assert = require('assert')

describe('Trim email', function () {
  it('should trim the email from the body', function (done) {
    trimEmail(req, {}, function () {
      assert(req.body.username === 'iggy@foo.com')
      done()
    })
  })
})
