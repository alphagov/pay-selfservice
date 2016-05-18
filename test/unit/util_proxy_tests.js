var should = require('chai').should();
var assert = require('assert');
var proxy = require(__dirname + '/../../app/utils/proxy.js');

describe('proxy settings', function () {

  beforeEach(function () {
    process.env.HTTP_PROXY = 'http://proxy:1234';
    process.env.HTTPS_PROXY = 'https://proxy:443';
    process.env.NO_PROXY = 'localhost:8080,localhost:9090';
  });

  afterEach(function () {
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.NO_PROXY;
    delete process.env.HTTP_PROXY_ENABLED;
  });

  it('should be available if HTTP_PROXY_ENABLED=true', function () {
    process.env.HTTP_PROXY_ENABLED = 'true';
    proxy.use();

    assert.equal(process.env.HTTP_PROXY, 'http://proxy:1234');
    assert.equal(process.env.HTTPS_PROXY, 'https://proxy:443');
    assert.equal(process.env.NO_PROXY, 'localhost:8080,localhost:9090');

  });
});