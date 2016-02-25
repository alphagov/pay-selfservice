var should = require('chai').should();
var assert = require('assert');
var clientFactory = require(__dirname + '/../app/services/client_factory.js');
var fs = require('fs');
process.env.SSL_DIR = "/tmp/";

describe('node rest client', function () {

  before(function () {
    fs.writeFile(process.env.SSL_DIR + "ca.cert.pem", "Hey there!");
  });

  it('should be using https/ssl', function () {
    process.env.DISABLE_INTERNAL_HTTPS = "false";
    var client = clientFactory.nodeClientInstance();
    assert.equal('SSL_OP_NO_TLSv1_2', client.connection.secureOptions);
  });

  it('should not use https/ssl when HTTPS is disabled', function () {
    process.env.DISABLE_INTERNAL_HTTPS = "true";
    var client = clientFactory.nodeClientInstance();
    assert.deepEqual({}, client.connection);
  });

  after(function () {
    fs.unlink(process.env.SSL_DIR + "ca.cert.pem");
  });

});

describe('request rest client', function () {

  before(function () {
    fs.writeFile(process.env.SSL_DIR + "ca.cert.pem", "Hey there!");
  });

  it('should be using https/ssl', function () {
    process.env.DISABLE_INTERNAL_HTTPS = "false";
    var client = clientFactory.requestClientInstance();
    assert.equal('SSL_OP_NO_TLSv1_2', client('http://google.com').agentOptions.secureOptions);
  });

  it('should not use https/ssl when HTTPS is disabled', function () {
    process.env.DISABLE_INTERNAL_HTTPS = "true";
    var client = clientFactory.requestClientInstance();
    assert.deepEqual({}, client('http://google.com').agentOptions);
  });

  after(function () {
    fs.unlink(process.env.SSL_DIR + "ca.cert.pem");
  });

});