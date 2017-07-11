'use strict'

// NPM dependencies
const nock = require('nock')
const csrf = require('csrf')
const supertest = require('supertest')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const gatewayAccountFixtures = require('../../fixtures/gateway_account_fixtures')
const serviceFixtures = require('../../fixtures/service_fixtures')
const userFixtures = require('../../fixtures/user_fixtures')
const paths = require('../../../app/paths')
const serviceRegistrationService = require('../../../app/services/service_registration_service')

// Constants
const CONNECTOR_CREATE_ACCOUNT_URL = '/v1/api/accounts'
const ADMINUSER_CREATE_SERVICE_URL = '/v1/api/services'
const ADMINUSER_CREATE_USER_URL = '/v1/api/users'
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const connectorMock = nock(process.env.CONNECTOR_URL)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('create populated service', function () {

  afterEach((done) => {
    nock.cleanAll()
    done()
  })

  it('should create a sandbox gateway account, a service, a user and associate those three', function (done) {
    const gatewayAccountId = '1'

    const connectorCreateGatewayAccountResponse =
      gatewayAccountFixtures.validCreateGatewayAccountResponse({gateway_account_id: gatewayAccountId}).getPlain()
    const adminUserServiceCreateResponse = serviceFixtures.validCreateServiceResponse()
    const minimalUser = userFixtures.validMinimalUser().getPlain()
    minimalUser.username = minimalUser.email
    const adminUserCreateUserResponse = userFixtures.validUserResponse(minimalUser).getPlain()

    const createAccountMock = connectorMock.post(CONNECTOR_CREATE_ACCOUNT_URL)
      .reply(201, connectorCreateGatewayAccountResponse)
    const createServiceMock = adminusersMock.post(ADMINUSER_CREATE_SERVICE_URL, {gateway_account_ids: [gatewayAccountId]})
      .reply(201, adminUserServiceCreateResponse)
    const createUserMock = adminusersMock.post(ADMINUSER_CREATE_USER_URL)
      .reply(201, adminUserCreateUserResponse)

    serviceRegistrationService.createPopulatedService({
      email: minimalUser.email,
      phoneNumber: minimalUser.telephone_number,
      role: minimalUser.role
    }).should.be.fulfilled.then(user => {
      expect(createUserMock.isDone()).to.be.true
      expect(createServiceMock.isDone()).to.be.true
      expect(createAccountMock.isDone()).to.be.true
      expect(user.email).to.equal(minimalUser.email)
      expect(user.username).to.equal(minimalUser.email)
      expect(user.telephoneNumber).to.equal(minimalUser.telephone_number)
    }).should.notify(done)
  })

  it('should error if creation of a gateway account failed', function (done) {
    const createAccountMock = connectorMock.post(CONNECTOR_CREATE_ACCOUNT_URL).reply(500)
    const minimalUser = userFixtures.validMinimalUser().getPlain()
    minimalUser.username = minimalUser.email
    serviceRegistrationService.createPopulatedService({
      email: minimalUser.email,
      phoneNumber: minimalUser.telephone_number,
      role: minimalUser.role
    }).should.be.rejected.then(error => {
      expect(createAccountMock.isDone()).to.be.true
      expect(error.errorCode).to.equal(500);
    }).should.notify(done);
  })

  it('should error if creation of a gateway account succeeded, but service creation failed', function (done) {
    const gatewayAccountId = '1'

    const connectorCreateGatewayAccountResponse =
      gatewayAccountFixtures.validCreateGatewayAccountResponse({gateway_account_id: gatewayAccountId}).getPlain()
    const minimalUser = userFixtures.validMinimalUser().getPlain()
    minimalUser.username = minimalUser.email

    const createAccountMock = connectorMock.post(CONNECTOR_CREATE_ACCOUNT_URL)
      .reply(201, connectorCreateGatewayAccountResponse)
    const createServiceMock = adminusersMock.post(ADMINUSER_CREATE_SERVICE_URL).reply(500)

    serviceRegistrationService.createPopulatedService({
      email: minimalUser.email,
      phoneNumber: minimalUser.telephone_number,
      role: minimalUser.role
    }).should.be.rejected.then(error => {
      expect(createAccountMock.isDone()).to.be.true
      expect(createServiceMock.isDone()).to.be.true
      expect(error.errorCode).to.equal(500);
    }).should.notify(done);
  })

  it('should error if creation of a gateway account succeeded and service creation succeeded, but user creation failed', function (done) {
    const gatewayAccountId = '1'

    const connectorCreateGatewayAccountResponse =
      gatewayAccountFixtures.validCreateGatewayAccountResponse({gateway_account_id: gatewayAccountId}).getPlain()
    const adminUserServiceCreateResponse = serviceFixtures.validCreateServiceResponse()
    const minimalUser = userFixtures.validMinimalUser().getPlain()
    minimalUser.username = minimalUser.email

    const createAccountMock = connectorMock.post(CONNECTOR_CREATE_ACCOUNT_URL)
      .reply(201, connectorCreateGatewayAccountResponse)
    const createServiceMock = adminusersMock.post(ADMINUSER_CREATE_SERVICE_URL, {gateway_account_ids: [gatewayAccountId]})
      .reply(201, adminUserServiceCreateResponse)
    const createUserMock = adminusersMock.post(ADMINUSER_CREATE_USER_URL).reply(500)

    serviceRegistrationService.createPopulatedService({
      email: minimalUser.email,
      phoneNumber: minimalUser.telephone_number,
      role: minimalUser.role
    }).should.be.rejected.then(error => {
      expect(createUserMock.isDone()).to.be.true
      expect(createServiceMock.isDone()).to.be.true
      expect(createAccountMock.isDone()).to.be.true
      expect(error.errorCode).to.equal(500);
    }).should.notify(done)
  })

  it('should error if creation of a gateway account succeeded and service creation succeeded, but user already exists', function (done) {
    const gatewayAccountId = '1'

    const connectorCreateGatewayAccountResponse =
      gatewayAccountFixtures.validCreateGatewayAccountResponse({gateway_account_id: gatewayAccountId}).getPlain()
    const adminUserServiceCreateResponse = serviceFixtures.validCreateServiceResponse()
    const minimalUser = userFixtures.validMinimalUser().getPlain()
    minimalUser.username = minimalUser.email

    const createAccountMock = connectorMock.post(CONNECTOR_CREATE_ACCOUNT_URL)
      .reply(201, connectorCreateGatewayAccountResponse)
    const createServiceMock = adminusersMock.post(ADMINUSER_CREATE_SERVICE_URL, {gateway_account_ids: [gatewayAccountId]})
      .reply(201, adminUserServiceCreateResponse)
    const createUserMock = adminusersMock.post(ADMINUSER_CREATE_USER_URL).reply(409)

    serviceRegistrationService.createPopulatedService({
      email: minimalUser.email,
      phoneNumber: minimalUser.telephone_number,
      role: minimalUser.role
    }).should.be.rejected.then(error => {
      expect(createUserMock.isDone()).to.be.true
      expect(createServiceMock.isDone()).to.be.true
      expect(createAccountMock.isDone()).to.be.true
      expect(error.errorCode).to.equal(409);
    }).should.notify(done)
  })
})
