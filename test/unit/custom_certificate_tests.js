var should = require('chai').should();
var assert = require('assert');
var customCertificate  = require(__dirname + '/../../app/utils/custom_certificate.js');
var opts = require('https').globalAgent.options;

describe('custom certificate', function () {

  beforeEach(function(){
    process.env.CA_FILEPATH = __dirname + '/../test_helpers/test_ca.pem';
  });

  afterEach(function(){
    process.env.CA_FILEPATH = undefined;
  });

  it('should not set secure options by default', function(){
    assert.equal(undefined, opts.ca);
  });

  it('should set secure options', function(){
    customCertificate.use();
    assert.equal(1, opts.ca.length);
    assert.equal('SSL_OP_NO_TLSv1_2', opts.secureOptions);
  });

});