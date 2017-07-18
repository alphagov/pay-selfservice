'use strict'

// NPM dependencies
const nock = require('nock')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const gatewayAccountFixtures = require('../../fixtures/gateway_account_fixtures')
const inviteFixtures = require('../../fixtures/invite_fixtures')
const serviceRegistrationService = require('../../../app/services/service_registration_service')

// Constants
const CONNECTOR_ACCOUNTS_URL = '/v1/api/accounts'
const ADMINUSERS_INVITES_URL = '/v1/api/invites'
const connectorMock = nock(process.env.CONNECTOR_URL)
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('create populated service', function () {
  afterEach((done) => {
    nock.cleanAll()
    done()
  })

  it('should create a sandbox gateway account and complete invite successfully', function (done) {
    const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'
    const userExternalId = 'f84b8210f93d455e97baeaf3fea72cf4'
    const serviceExternalId = '43a6818b522b4a628a14355614665ca3'
    const gatewayAccountId = '1'

    const mockConnectorCreateGatewayAccountResponse =
      gatewayAccountFixtures.validCreateGatewayAccountResponse({
        gateway_account_id: gatewayAccountId
      }).getPlain()
    const mockAdminUsersInviteCompleteRequest =
      inviteFixtures.validInviteCompleteRequest({
        gateway_account_ids: [gatewayAccountId]
      }).getPlain()
    const mockAdminUsersInviteCompleteResponse =
      inviteFixtures.validInviteCompleteResponse({
        invite: {
          code: inviteCode,
          type: 'service',
          disabled: true
        },
        user_external_id: userExternalId,
        service_external_id: serviceExternalId
      }).getPlain()

    const createGatewayAccountMock = connectorMock.post(CONNECTOR_ACCOUNTS_URL)
      .reply(201, mockConnectorCreateGatewayAccountResponse)
    const completeServiceInviteMock = adminusersMock.post(`${ADMINUSERS_INVITES_URL}/${inviteCode}/complete`, mockAdminUsersInviteCompleteRequest)
      .reply(200, mockAdminUsersInviteCompleteResponse)

    serviceRegistrationService.createPopulatedService(inviteCode).should.be.fulfilled.then(completeServiceInviteResponse => {
      expect(createGatewayAccountMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(completeServiceInviteMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(completeServiceInviteResponse.invite.code).to.equal(mockAdminUsersInviteCompleteResponse.invite.code)
      expect(completeServiceInviteResponse.invite.type).to.equal(mockAdminUsersInviteCompleteResponse.invite.type)
      expect(completeServiceInviteResponse.invite.disabled).to.equal(mockAdminUsersInviteCompleteResponse.invite.disabled)
      expect(completeServiceInviteResponse.user_external_id).to.equal(mockAdminUsersInviteCompleteResponse.user_external_id)
      expect(completeServiceInviteResponse.service_external_id).to.equal(mockAdminUsersInviteCompleteResponse.service_external_id)
    }).should.notify(done)
  })

  it('should error if creation of a gateway account failed', function (done) {
    const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'

    const mockConnectorCreateGatewayAccountResponse = connectorMock.post(CONNECTOR_ACCOUNTS_URL)
      .reply(500)

    serviceRegistrationService.createPopulatedService(inviteCode).should.be.rejected.then(error => {
      expect(mockConnectorCreateGatewayAccountResponse.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(error.errorCode).to.equal(500)
    }).should.notify(done)
  })

  it('should error if creation of a gateway account succeeded, but complete invite failed', function (done) {
    const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'
    const gatewayAccountId = '1'

    const mockConnectorCreateGatewayAccountResponse =
      gatewayAccountFixtures.validCreateGatewayAccountResponse({
        gateway_account_id: gatewayAccountId
      }).getPlain()
    const mockAdminUsersInviteCompleteRequest =
      inviteFixtures.validInviteCompleteRequest({
        gateway_account_ids: [gatewayAccountId]
      }).getPlain()

    const createGatewayAccountMock = connectorMock.post(CONNECTOR_ACCOUNTS_URL)
      .reply(201, mockConnectorCreateGatewayAccountResponse)
    const completeServiceInviteMock = adminusersMock.post(`${ADMINUSERS_INVITES_URL}/${inviteCode}/complete`, mockAdminUsersInviteCompleteRequest)
      .reply(500)

    serviceRegistrationService.createPopulatedService(inviteCode).should.be.rejected.then(error => {
      expect(createGatewayAccountMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(completeServiceInviteMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(error.errorCode).to.equal(500)
    }).should.notify(done)
  })

  it('should error if creation of a gateway account succeeded and complete invite succeeded, but user already exists', function (done) {
    const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'
    const gatewayAccountId = '1'

    const mockConnectorCreateGatewayAccountResponse =
      gatewayAccountFixtures.validCreateGatewayAccountResponse({
        gateway_account_id: gatewayAccountId
      }).getPlain()
    const mockAdminUsersInviteCompleteRequest =
      inviteFixtures.validInviteCompleteRequest({
        gateway_account_ids: [gatewayAccountId]
      }).getPlain()

    const createGatewayAccountMock = connectorMock.post(CONNECTOR_ACCOUNTS_URL)
      .reply(201, mockConnectorCreateGatewayAccountResponse)
    const completeServiceInviteMock = adminusersMock.post(`${ADMINUSERS_INVITES_URL}/${inviteCode}/complete`, mockAdminUsersInviteCompleteRequest)
      .reply(409)

    serviceRegistrationService.createPopulatedService(inviteCode).should.be.rejected.then(error => {
      expect(createGatewayAccountMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(completeServiceInviteMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(error.errorCode).to.equal(409)
    }).should.notify(done)
  })
})
