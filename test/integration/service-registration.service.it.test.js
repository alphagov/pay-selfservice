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

describe('complete invite', function () {
  afterEach((done) => {
    nock.cleanAll()
    done()
  })

  describe('the complete invite response from adminusers has a service_external_id', () => {
    it('should create a sandbox gateway account and complete invite successfully', function (done) {
      const inviteCode = 'a-valid-invite-code'
      const userExternalId = 'f84b8210f93d455e97baeaf3fea72cf4'
      const serviceExternalId = '43a6818b522b4a628a14355614665ca3'
      const gatewayAccountId = '1'

      const mockConnectorCreateGatewayAccountResponse =
        gatewayAccountFixtures.validGatewayAccountResponse({
          gateway_account_id: gatewayAccountId
        })
      const mockAdminUsersInviteCompleteRequest =
        inviteFixtures.validInviteCompleteRequest({
          gateway_account_ids: [gatewayAccountId]
        })
      const mockAdminUsersInviteCompleteResponse =
        inviteFixtures.validInviteCompleteResponse({
          invite: {
            code: inviteCode,
            type: 'service',
            disabled: true
          },
          user_external_id: userExternalId,
          service_external_id: serviceExternalId
        })
      const getUserResponse = userFixtures.validUserResponse({ external_id: userExternalId })

      const createGatewayAccountMock = connectorMock.post(CONNECTOR_ACCOUNTS_URL)
        .reply(201, mockConnectorCreateGatewayAccountResponse)
      const completeServiceInviteMock = adminusersMock.post(`${ADMINUSERS_INVITES_URL}/${inviteCode}/complete`, mockAdminUsersInviteCompleteRequest)
        .reply(200, mockAdminUsersInviteCompleteResponse)
      const getUserMock = adminusersMock.get(`/v1/api/users/${userExternalId}`)
        .reply(200, getUserResponse)
      adminusersMock.patch(`/v1/api/services/${serviceExternalId}`)
        .reply(200, {})

      serviceRegistrationService.completeInvite(inviteCode).should.be.fulfilled.then(completeInviteResponse => {
        expect(createGatewayAccountMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
        expect(completeServiceInviteMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
        expect(getUserMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
        expect(completeInviteResponse.user_external_id).to.equal(userExternalId)
      }).should.notify(done)
    })

    it('should error if creation of a gateway account failed', function (done) {
      const inviteCode = 'a-valid-invite-code'
      const mockAdminUsersInviteCompleteResponse =
        inviteFixtures.validInviteCompleteResponse({
          service_external_id: 'a-service-id'
        })

      adminusersMock.post(`${ADMINUSERS_INVITES_URL}/${inviteCode}/complete`)
        .reply(200, mockAdminUsersInviteCompleteResponse)
      const mockConnectorCreateGatewayAccountResponse = connectorMock.post(CONNECTOR_ACCOUNTS_URL)
        .reply(500)

      serviceRegistrationService.completeInvite(inviteCode).should.be.rejected.then(error => {
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
        })
      const mockAdminUsersInviteCompleteRequest =
        inviteFixtures.validInviteCompleteRequest({
          gateway_account_ids: [gatewayAccountId]
        })

      connectorMock.post(CONNECTOR_ACCOUNTS_URL)
        .reply(201, mockConnectorCreateGatewayAccountResponse)
      const completeServiceInviteMock = adminusersMock.post(`${ADMINUSERS_INVITES_URL}/${inviteCode}/complete`, mockAdminUsersInviteCompleteRequest)
        .reply(500)

      serviceRegistrationService.completeInvite(inviteCode).then(() => {
        done('should not be called')
      }).catch(error => {
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
        })
      const mockAdminUsersInviteCompleteRequest =
        inviteFixtures.validInviteCompleteRequest({
          gateway_account_ids: [gatewayAccountId]
        })

      connectorMock.post(CONNECTOR_ACCOUNTS_URL)
        .reply(201, mockConnectorCreateGatewayAccountResponse)
      const completeServiceInviteMock = adminusersMock.post(`${ADMINUSERS_INVITES_URL}/${inviteCode}/complete`, mockAdminUsersInviteCompleteRequest)
        .reply(409)

      serviceRegistrationService.completeInvite(inviteCode).should.be.rejected.then(error => {
        expect(completeServiceInviteMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
        expect(error.errorCode).to.equal(409)
      }).should.notify(done)
    })
  })

  describe('the complete invite response from adminusers does not have a service_external_id', () => {
    it('should not attempt to create a gateway account', (done) => {
      const inviteCode = 'a-valid-invite-code'
      const userExternalId = 'f84b8210f93d455e97baeaf3fea72cf4'
      const serviceExternalId = '43a6818b522b4a628a14355614665ca3'
      const gatewayAccountId = '1'

      const mockAdminUsersInviteCompleteRequest =
        inviteFixtures.validInviteCompleteRequest({
          gateway_account_ids: [gatewayAccountId]
        })
      const mockAdminUsersInviteCompleteResponse =
        inviteFixtures.inviteCompleteResponseWithNoServiceExternalId({
          invite: {
            code: inviteCode,
            type: 'service',
            disabled: true
          },
          user_external_id: userExternalId,
          service_external_id: serviceExternalId
        })

      const completeServiceInviteMock = adminusersMock.post(`${ADMINUSERS_INVITES_URL}/${inviteCode}/complete`, mockAdminUsersInviteCompleteRequest)
        .reply(200, mockAdminUsersInviteCompleteResponse)

      serviceRegistrationService.completeInvite(inviteCode).should.be.fulfilled.then(completeInviteResponse => {
        expect(completeServiceInviteMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
        expect(completeInviteResponse.user_external_id).to.equal(userExternalId)
      }).should.notify(done)
    })
  })
})
