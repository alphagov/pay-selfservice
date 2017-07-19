var path = require('path')
var req = {body: {username: ' iggy@foo.com '}}
var trimEmail = require(path.join(__dirname, '/../../../app/middleware/trim_username.js'))
var assert = require('assert')

describe('Trim email', function () {
  it('should trim the email from the body', function (done) {
    trimEmail(req, {}, function () {
      assert(req.body.username === 'iggy@foo.com')
      done()
    })
  })
})
