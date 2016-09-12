var _ = require('lodash');
var req = {body: { email: " iggy@foo.com "}};
var trimEmail = require(__dirname + '/../../app/middleware/trim_email.js');
var assert = require('assert');


describe('Trim email', function () {
  it('should trim the email from the body', function (done) {
    trimEmail(req,{},function(){
      assert(req.body.email === 'iggy@foo.com');
      done();
    });
  });
});
