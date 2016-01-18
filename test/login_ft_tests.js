var request = require('supertest');
var app = require(__dirname + '/../server.js').getApp;
var winston = require('winston');
var portfinder = require('portfinder');
var nock = require('nock');
var cookie = require(__dirname + '/utils/session.js');
var should = require('chai').should();

portfinder.getPort(function (err, freePort) {
  var CONNECTOR_ACCOUNT_CREDENTIALS_PATH = "/v1/frontend/accounts";
  var SELF_SERVICE_CREDENTIALS_PATH = "/selfservice/credentials";
  var SELF_SERVICE_EDIT_CREDENTIALS_PATH = "/selfservice/credentials?edit";

  var localServer = 'http://localhost:' + freePort;

  var connectorMock = nock(localServer);
});
