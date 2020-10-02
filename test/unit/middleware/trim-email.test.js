var path = require('path')
var req = { body: { username: ' iggy@foo.com ' } }
var trimEmail = require(path.join(__dirname, '/../../../app/middleware/trim-username.js'))
var assert = require('assert')

describe('Trim email', () => {
  it('should trim the email from the body', done => {
    trimEmail(req, {}, function () {
      assert(req.body.username === 'iggy@foo.com')
      done()
    })
  })
})
