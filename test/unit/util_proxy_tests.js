var should = require('chai').should();
var assert = require('assert');
var proxy = require(__dirname + '/../../app/utils/proxy.js');
var https = require('https');
var http = require('http');
var _ = require('lodash');
var sinon = require('sinon');
var tunnel = require('tunnel');
var expect = require("chai").expect;



describe('proxy settings', function () {

  beforeEach(function () {
    process.env.HTTP_PROXY = 'http://proxy:1234';
    process.env.HTTPS_PROXY = 'https://proxy:443';
    process.env.NO_PROXY = 'bar.com,baz.com';
  });

  afterEach(function () {
    delete process.env.TUNNEL_HTTP_PROXY;
    delete process.env.TUNNEL_HTTPS_PROXY;
    delete process.env.TUNNEL_NO_PROXY;
    proxy.reset();
  });

  it('should capture and delete env proxy vars', function () {

    proxy.use();
    assert.equal(process.env.TUNNEL_HTTP_PROXY, 'http://proxy:1234');
    assert.equal(process.env.TUNNEL_HTTPS_PROXY, 'https://proxy:443');
    assert.equal(process.env.TUNNEL_NO_PROXY, 'bar.com,baz.com');

    assert.equal(process.env.HTTP_PROXY, undefined);
    assert.equal(process.env.HTTP_PROXY, undefined);
    assert.equal(process.env.HTTP_PROXY, undefined);
  });

  it('should proxy any traffic not in NO_PROXY list', function () {
    var tunnelAgent = sinon.stub(tunnel, 'httpsOverHttp');
    var httpRequest = sinon.stub(http, 'request').returns({end: _.noop});

    proxy.use();

    https.get('https://foo.com');
    httpRequest.restore();

    expect(tunnel.httpsOverHttp.getCall(0).args[0].proxy).to.deep.equal({
      host: 'proxy',
      port: '443'
    });

    tunnelAgent.restore();
  });

  it('should not proxy any traffic in NO_PROXY list', function () {
    var tunnelAgent = sinon.stub(tunnel, 'httpsOverHttp');
    var httpRequest = sinon.stub(http, 'request').returns({end: _.noop});

    proxy.use();

    https.get('https://baz.com');
    https.get('https://bar.com');

    httpRequest.restore();

    expect(tunnel.httpsOverHttp.callCount).to.equal(0);

    tunnelAgent.restore();
  });
});
