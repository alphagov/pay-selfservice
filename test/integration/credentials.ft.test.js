'use strict'

const path = require('path')
require(path.join(__dirname, '/../test-helpers/serialize-mock.js'))
const userCreator = require(path.join(__dirname, '/../test-helpers/user-creator.js'))
const request = require('supertest')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const nock = require('nock')
const csrf = require('csrf')
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const mockSession = require('../test-helpers/mock-session.js')
const { expect } = require('chai')
const ACCOUNT_ID = '182364'
const CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + ACCOUNT_ID
const CONNECTOR_ACCOUNT_CREDENTIALS_PATH = CONNECTOR_ACCOUNT_PATH + '/credentials'
const CONNECTOR_ACCOUNT_NOTIFICATION_CREDENTIALS_PATH = '/v1/api/accounts/' + ACCOUNT_ID + '/notification-credentials'

const requestId = 'some-unique-id'
const defaultCorrelationHeader = {
  reqheaders: { 'x-request-id': requestId }
}

const connectorMock = nock(process.env.CONNECTOR_URL, defaultCorrelationHeader)

let app

describe('Credentials endpoints', () => {
  describe('The ' + paths.credentials.index + ' endpoint', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      const permissions = 'gateway-credentials:read'
      const user = mockSession.getUser({
        gateway_account_ids: [ACCOUNT_ID], permissions: [{ name: permissions }]
      })
      app = mockSession.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should display empty credential values when no gateway credentials are set', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'sandbox',
          'gateway_account_id': '1',
          'credentials': {}
        })

      buildGetRequest(paths.credentials.index, app)
        .expect(200)
        .expect(response => {
          expect(response.body.currentGatewayAccount.credentials).to.be.empty // eslint-disable-line
        })
        .end(done)
    })

    it('should display received credentials from connector', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'sandbox',
          'gateway_account_id': '1',
          'credentials': { 'username': 'a-username' }
        })

      buildGetRequest(paths.credentials.index, app)
        .expect(200)
        .expect(response => {
          expect(response.body.currentGatewayAccount.credentials).to.deep.equal({ 'username': 'a-username' })
        })
        .end(done)
    })

    it('should return the account', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'sandbox',
          'gateway_account_id': '1',
          'credentials': { username: 'a-username', merchant_id: 'a-merchant-id' }
        })

      buildGetRequest(paths.credentials.index, app)
        .expect(200)
        .expect(response => {
          expect(response.body.currentGatewayAccount.gateway_account_id).to.equal('1')
        })
        .end(done)
    })

    it('should display an error if the account does not exist', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(404, {
          'message': "The gateway account id '" + ACCOUNT_ID + "' does not exist"
        })

      buildGetRequest(paths.credentials.index, app)
        .expect(500, { 'message': 'There is a problem with the payments platform' })
        .end(done)
    })

    it('should display an error if connector returns any other error', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(999, {
          'message': 'Some error in Connector'
        })

      buildGetRequest(paths.credentials.index, app)
        .expect(500, { 'message': 'There is a problem with the payments platform' })
        .end(done)
    })

    it('should display an error if the connection to connector fails', function (done) {
      // No connectorMock defined on purpose to mock a network failure

      buildGetRequest(paths.credentials.index, app)
        .expect(500, { 'message': 'There is a problem with the payments platform' })
        .end(done)
    })
  })

  describe('The ' + paths.credentials.edit + ' endpoint', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      const permissions = 'gateway-credentials:update'
      const user = mockSession.getUser({
        gateway_account_ids: [ACCOUNT_ID], permissions: [{ name: permissions }]
      })
      app = mockSession.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should display payment provider name', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'sandbox',
          'gateway_account_id': '1',
          'credentials': {}
        })

      buildGetRequest(paths.credentials.edit, app)
        .expect(200)
        .expect(response => {
          expect(response.body.currentGatewayAccount.payment_provider).to.equal('sandbox')
        })
        .end(done)
    })

    it('should display empty credential values when no gateway credentials are set', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'sandbox',
          'gateway_account_id': '1',
          'credentials': {}
        })

      buildGetRequest(paths.credentials.edit, app)
        .expect(200)
        .expect(response => {
          expect(response.body.currentGatewayAccount.credentials).to.be.empty // eslint-disable-line
        })
        .end(done)
    })

    it('should display received credentials from connector', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'sandbox',
          'gateway_account_id': '1',
          'credentials': { 'username': 'a-username' }
        })

      buildGetRequest(paths.credentials.edit, app)
        .expect(200)
        .expect(response => {
          expect(response.body.currentGatewayAccount.credentials).to.deep.equal({ 'username': 'a-username' })
        })
        .end(done)
    })

    it('should return the account', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'sandbox',
          'gateway_account_id': '1',
          'credentials': { username: 'a-username' }
        })

      buildGetRequest(paths.credentials.edit, app)
        .expect(200)
        .expect(response => {
          expect(response.body.currentGatewayAccount.gateway_account_id).to.equal('1')
        })
        .end(done)
    })

    it('should display an error if the account does not exist', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(404, {
          'message': "The gateway account id '" + ACCOUNT_ID + "' does not exist"
        })

      buildGetRequest(paths.credentials.edit, app)
        .expect(500, { 'message': 'There is a problem with the payments platform' })
        .end(done)
    })

    it('should display an error if connector returns any other error', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(999, {
          'message': 'Some error in Connector'
        })

      buildGetRequest(paths.credentials.edit, app)
        .expect(500, { 'message': 'There is a problem with the payments platform' })
        .end(done)
    })

    it('should display an error if the connection to connector fails', function (done) {
      // No connectorMock defined on purpose to mock a network failure

      buildGetRequest(paths.credentials.edit, app)
        .expect(500, { 'message': 'There is a problem with the payments platform' })
        .end(done)
    })
  })

  describe('The ' + paths.notificationCredentials.edit + ' endpoint', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      const permissions = 'gateway-credentials:update'
      const user = mockSession.getUser({
        gateway_account_ids: [ACCOUNT_ID], permissions: [{ name: permissions }]
      })
      app = mockSession.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should display payment provider name', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'sandbox',
          'gateway_account_id': '1',
          'credentials': {}
        })

      buildGetRequest(paths.notificationCredentials.edit, app)
        .expect(200)
        .expect(response => {
          expect(response.body.currentGatewayAccount.payment_provider).to.equal('sandbox')
        })
        .end(done)
    })

    it('should display empty credential values when no gateway credentials are set', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'sandbox',
          'gateway_account_id': '1',
          'credentials': {}
        })

      buildGetRequest(paths.notificationCredentials.edit, app)
        .expect(200)
        .expect(response => {
          expect(response.body.currentGatewayAccount.credentials).to.be.empty // eslint-disable-line
        })
        .end(done)
    })

    it('should display received credentials from connector', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'sandbox',
          'gateway_account_id': '1',
          'credentials': { 'username': 'a-username' }
        })

      buildGetRequest(paths.notificationCredentials.edit, app)
        .expect(200)
        .expect(response => {
          expect(response.body.currentGatewayAccount.credentials).to.be.deep.equal({ 'username': 'a-username' })
        })
        .end(done)
    })

    it('should return the account', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'sandbox',
          'gateway_account_id': '1',
          'credentials': { username: 'a-username', merchant_id: 'a-merchant-id' }
        })

      buildGetRequest(paths.notificationCredentials.edit, app)
        .expect(200)
        .expect(response => {
          expect(response.body.currentGatewayAccount.gateway_account_id).to.equal('1')
        })
        .end(done)
    })

    it('should display an error if the account does not exist', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(404, {
          'message': "The gateway account id '" + ACCOUNT_ID + "' does not exist"
        })

      buildGetRequest(paths.notificationCredentials.edit, app)
        .expect(500, { 'message': 'There is a problem with the payments platform' })
        .end(done)
    })

    it('should display an error if connector returns any other error', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(999, {
          'message': 'Some error in Connector'
        })

      buildGetRequest(paths.notificationCredentials.edit, app)
        .expect(500, { 'message': 'There is a problem with the payments platform' })
        .end(done)
    })

    it('should display an error if the connection to connector fails', function (done) {
      // No connectorMock defined on purpose to mock a network failure

      buildGetRequest(paths.notificationCredentials.edit, app)
        .expect(500, { 'message': 'There is a problem with the payments platform' })
        .end(done)
    })
  })

  describe('The notification credentials', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      const permissions = 'gateway-credentials:read'
      const user = mockSession.getUser({
        gateway_account_ids: [ACCOUNT_ID], permissions: [{ name: permissions }]
      })
      app = mockSession.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should pass through the notification credentials', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'smartpay',
          'gateway_account_id': '1',
          'credentials': {
            'username': 'a-username',
            'merchant_id': 'a-merchant-id'
          },
          'notification_credentials': { username: 'a-notification-username' }
        })

      buildGetRequest(paths.notificationCredentials.index, app)
        .expect(200)
        .expect(response => {
          expect(response.body.currentGatewayAccount.notification_credentials).to.deep.equal({ username: 'a-notification-username' })
        })
        .end(done)
    })
  })

  describe('The provider update credentials endpoint', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      const permissions = 'gateway-credentials:update'
      const user = mockSession.getUser({
        gateway_account_ids: [ACCOUNT_ID], permissions: [{ name: permissions }]
      })
      app = mockSession.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should send new username, password and merchant_id credentials to connector', function (done) {
      connectorMock.patch(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
        'credentials': {
          'username': 'a-username',
          'password': 'a-password',
          'merchant_id': 'a-merchant-id'
        }
      }).reply(200, {})

      const sendData = { 'username': 'a-username', 'password': 'a-password', 'merchantId': 'a-merchant-id' }
      const expectedLocation = paths.yourPsp.index
      const path = paths.credentials.index
      buildFormPostRequest(path, sendData, true, app)
        .expect(303, {})
        .expect('Location', expectedLocation)
        .end(done)
    })

    it('should send new username, password, merchant_id, sha_in_passphrase and sha_out_passphrase credentials to connector', function (done) {
      connectorMock.patch(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
        'credentials': {
          'username': 'a-username',
          'password': 'a-password',
          'merchant_id': 'a-psp-id',
          'sha_in_passphrase': 'a-sha-in-passphrase',
          'sha_out_passphrase': 'a-sha-out-passphrase'

        }
      }).reply(200, {})

      const sendData = {
        'username': 'a-username',
        'password': 'a-password',
        'merchantId': 'a-psp-id',
        'shaInPassphrase': 'a-sha-in-passphrase',
        'shaOutPassphrase': 'a-sha-out-passphrase'
      }
      const expectedLocation = paths.yourPsp.index
      const path = paths.credentials.index
      buildFormPostRequest(path, sendData, true, app)
        .expect(303, {})
        .expect('Location', expectedLocation)
        .end(done)
    })

    it('should send any arbitrary credentials together with username and password to connector', function (done) {
      connectorMock.patch(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
        'credentials': {
          'username': 'a-username',
          'password': 'a-password'
        }
      })
        .reply(200, {})

      const sendData = { 'username': 'a-username', 'password': 'a-password' }
      const expectedLocation = paths.yourPsp.index
      const path = paths.credentials.index
      buildFormPostRequest(path, sendData, true, app)
        .expect(303, {})
        .expect('Location', expectedLocation)
        .end(done)
    })

    it('should display an error if connector returns failure', function (done) {
      connectorMock.patch(CONNECTOR_ACCOUNT_PATH, {
        'username': 'a-username',
        'password': 'a-password'
      })
        .reply(999, {
          'message': 'Error message'
        })

      const sendData = { 'username': 'a-username', 'password': 'a-password' }
      const expectedData = { 'message': 'There is a problem with the payments platform' }
      const path = paths.credentials.index
      buildFormPostRequest(path, sendData, true, app)
        .expect(500, expectedData)
        .end(done)
    })

    it('should display an error if the connection to connector fails', function (done) {
      // No connectorMock defined on purpose to mock a network failure

      const sendData = { 'username': 'a-username', 'password': 'a-password' }
      const expectedData = { 'message': 'There is a problem with the payments platform' }
      const path = paths.credentials.index
      buildFormPostRequest(path, sendData, true, app)
        .expect(500, expectedData)
        .end(done)
    })

    it('should fail if there is no csrf', done => {
      connectorMock.patch(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
        'username': 'a-username',
        'password': 'a-password'
      }).reply(200, {})

      const sendData = { 'username': 'a-username', 'password': 'a-password' }
      const path = paths.credentials.index
      buildFormPostRequest(path, sendData, false, app)
        .expect(400, { message: 'There is a problem with the payments platform' })
        .end(done)
    })
  })

  describe('The provider update notification credentials endpoint', function () {
    let session
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      const permissions = 'gateway-credentials:update'
      const user = mockSession.getUser({
        gateway_account_ids: [ACCOUNT_ID], permissions: [{ name: permissions }]
      })
      session = mockSession.getMockSession(user)
      app = mockSession.createAppWithSession(getApp(), session)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should send new username and password notification credentials to connector', function (done) {
      connectorMock.post(CONNECTOR_ACCOUNT_NOTIFICATION_CREDENTIALS_PATH, {
        'username': 'a-notification-username',
        'password': 'a-notification-password'
      })
        .reply(200, {})

      const sendData = { 'username': 'a-notification-username', 'password': 'a-notification-password' }
      const expectedLocation = paths.yourPsp.index
      const path = paths.notificationCredentials.update
      buildFormPostRequest(path, sendData, true, app)
        .expect(303, {})
        .expect('Location', expectedLocation)
        .end(done)
    })

    it('should should flash a relevant error if no password is sent', function (done) {
      const sendData = { 'password': 'a-notification-password' }
      const path = paths.notificationCredentials.update
      buildFormPostRequest(path, sendData, true, app)
        .expect(res => {
          expect(res.statusCode).to.equal(302)
          expect(res.headers.location).to.equal(paths.notificationCredentials.edit)
          expect(session.flash.genericError).to.have.property('length').to.equal(1)
          expect(session.flash.genericError[0]).to.equal('Enter a username')
        })
        .end(done)
    })
    it('should should flash a relevant error if no password is sent', function (done) {
      const sendData = { 'username': 'a-notification-username' }
      const path = paths.notificationCredentials.update
      buildFormPostRequest(path, sendData, true, app)
        .expect(res => {
          expect(res.statusCode).to.equal(302)
          expect(res.headers.location).to.equal(paths.notificationCredentials.edit)
          expect(session.flash.genericError).to.have.property('length').to.equal(1)
          expect(session.flash.genericError[0]).to.equal('Enter a password')
        })
        .end(done)
    })

    it('should should flash a relevant error if too short a password is sent', function (done) {
      const sendData = { 'username': 'a-notification-username', 'password': '123456789' }
      const path = paths.notificationCredentials.update
      buildFormPostRequest(path, sendData, true, app)
        .expect(res => {
          expect(res.statusCode).to.equal(302)
          expect(res.headers.location).to.equal(paths.notificationCredentials.edit)
          expect(session.flash.genericError).to.have.property('length').to.equal(1)
          expect(session.flash.genericError[0]).to.equal('Password must be 10 characters or more')
        })
        .end(done)
    })
  })
})

function buildGetRequest (path, app) {
  return request(app)
    .get(path)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId)
}

function buildFormPostRequest (path, sendData, sendCSRF, app) {
  sendCSRF = (sendCSRF === undefined) ? true : sendCSRF
  if (sendCSRF) {
    sendData.csrfToken = csrf().create('123')
  }

  return request(app)
    .post(path)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('x-request-id', requestId)
    .send(sendData)
}
