'use strict'

const nock = require('nock')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const gatewayAccountFixtures = require('../fixtures/gateway-account.fixtures')
const inviteFixtures = require('../fixtures/invite.fixtures')
const userFixtures = require('../fixtures/user.fixtures')
const serviceRegistrationService = require('../../app/services/service-registration.service')

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
    const inviteCode = 'a-valid-invite-code'
    const userExternalId = 'f84b8210f93d455e97baeaf3fea72cf4'
    const serviceExternalId = '43a6818b522b4a628a14355614665ca3'
    const gatewayAccountId = '1'

    const mockConnectorCreateGatewayAccountResponse =
      gatewayAccountFixtures.validGatewayAccountResponse({
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
    const getUserResponse = userFixtures.validUserResponse({ external_id: userExternalId })

    const createGatewayAccountMock = connectorMock.post(CONNECTOR_ACCOUNTS_URL)
      .reply(201, mockConnectorCreateGatewayAccountResponse)
    const completeServiceInviteMock = adminusersMock.post(`${ADMINUSERS_INVITES_URL}/${inviteCode}/complete`, mockAdminUsersInviteCompleteRequest)
      .reply(200, mockAdminUsersInviteCompleteResponse)
    const getUserMock = adminusersMock.get(`/v1/api/users/${userExternalId}`)
      .reply(200, getUserResponse)

    serviceRegistrationService.createPopulatedService(inviteCode).should.be.fulfilled.then(user => {
      expect(createGatewayAccountMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(completeServiceInviteMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(getUserMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(user.externalId).to.equal(userExternalId)
    }).should.notify(done)
  })

  it('should error if creation of a gateway account failed', function (done) {
    const inviteCode = 'a-valid-invite-code'

    const mockConnectorCreateGatewayAccountResponse = connectorMock.post(CONNECTOR_ACCOUNTS_URL)
      .reply(500)

    serviceRegistrationService.createPopulatedService(inviteCode).should.be.rejected.then(error => {
      expect(mockConnectorCreateGatewayAccountResponse.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(error.errorCode).to.equal(500)
    }).should.notify(done)
  })

  it('should error if creation of a gateway account succeeded, but complete invite failed', function (done) {
    const inviteCode = 'a-valid-invite-code'
    const gatewayAccountId = '1'

    const mockConnectorCreateGatewayAccountResponse =
      gatewayAccountFixtures.validGatewayAccountResponse({
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

    serviceRegistrationService.createPopulatedService(inviteCode).then(() => {
      done('should not be called')
    }).catch(error => {
      expect(createGatewayAccountMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(completeServiceInviteMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      expect(error.errorCode).to.equal(500)
      done()
    })
  })

  it('should error if creation of a gateway account succeeded and complete invite succeeded, but user already exists', function (done) {
    const inviteCode = 'a-valid-invite-code'
    const gatewayAccountId = '1'

    const mockConnectorCreateGatewayAccountResponse =
      gatewayAccountFixtures.validGatewayAccountResponse({
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
