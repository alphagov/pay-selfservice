const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const User = require('../../../../models/User.class')
const userFixtures = require('../../../../../test/fixtures/user.fixtures')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

let req, res, responseStub, getServiceUsersStub, getInvitedUsersStub, teamMembersController

const getController = (stubs = {}) => {
  return proxyquire('./team-members.controller', {
    '../../../../utils/response': { response: stubs.response },
    '../../../../services/user.service':
      { getServiceUsers: stubs.getServiceUsers, getInvitedUsers: stubs.getInvitedUsers }
  })
}

const setupTest = (method, additionalReqProps = {}, additionalStubs = {}) => {
  responseStub = sinon.spy()
  const adminUser = new User(userFixtures.validUserResponse({
    external_id: 'user-id-for-admin-user',
    service_roles: {
      service: {
        service: { external_id: SERVICE_ID },
        role: { name: 'admin' }
      }
    }
  }))
  const viewOnlyUser = new User(userFixtures.validUserResponse(
    {
      external_id: 'user-id-for-view-only-user',
      service_roles: {
        service:
            {
              service: { external_id: SERVICE_ID },
              role: { name: 'view-only' }
            }
      }
    }))
  const users = [adminUser, viewOnlyUser]
  getServiceUsersStub = sinon.stub().resolves(users)

  const invitedAdminUser = { email: 'invited-admin-user@user.gov.uk', role: 'admin' }
  const invitedViewOnlyUser = { email: 'invited-view-only-user@user.gov.uk', role: 'view-only' }
  const invitedUsers = [invitedAdminUser, invitedViewOnlyUser]
  getInvitedUsersStub = sinon.stub().resolves(invitedUsers)

  teamMembersController = getController({
    response: responseStub,
    getServiceUsers: getServiceUsersStub,
    getInvitedUsers: getInvitedUsersStub,
    ...additionalStubs
  })
  res = {
    redirect: sinon.spy()
  }
  req = {
    user: new User({
      service_roles: [
        {
          role: {
            name: 'admin'
          },
          service: {
            external_id: SERVICE_ID
          }
        }
      ]
    }),
    service: {
      externalId: SERVICE_ID
    },
    account: {
      type: ACCOUNT_TYPE
    },
    ...additionalReqProps
  }
  teamMembersController[method](req, res)
}

describe('Controller: settings/team-members', () => {
  describe('get', () => {
    before(() => setupTest('get'))

    it('should call the response method', () => {
      expect(getServiceUsersStub.called).to.be.true // eslint-disable-line
      expect(getInvitedUsersStub.called).to.be.true // eslint-disable-line
      expect(responseStub.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0]).to.include(req)
      expect(responseStub.args[0]).to.include(res)
      expect(responseStub.args[0]).to.include('simplified-account/settings/team-members/index')
    })

    it('should pass context data to the response method', () => {
      expect(responseStub.args[0][3]).to.have.property('teamMembers').to.have.property('admin').to.have.length(1)
      expect(responseStub.args[0][3].teamMembers.admin[0]).to.have.property('externalId').to.equal('user-id-for-admin-user')
      expect(responseStub.args[0][3].teamMembers).to.have.property('view-only').to.have.length(1)
      expect(responseStub.args[0][3].teamMembers['view-only'][0]).to.have.property('externalId').to.equal('user-id-for-view-only-user')

      expect(responseStub.args[0][3]).to.have.property('invitedTeamMembers').to.have.property('admin').to.have.length(1)
      expect(responseStub.args[0][3].invitedTeamMembers.admin[0]).to.have.property('email').to.equal('invited-admin-user@user.gov.uk')
      expect(responseStub.args[0][3].invitedTeamMembers).to.have.property('view-only').to.have.length(1)
      expect(responseStub.args[0][3].invitedTeamMembers['view-only'][0]).to.have.property('email').to.equal('invited-view-only-user@user.gov.uk')

      expect(responseStub.args[0][3]).to.have.property('inviteTeamMemberLink')
        .to.equal('/simplified/service/service-id-123abc/account/test/team-members/invite')
      expect(responseStub.args[0][3]).to.have.property('numberInvitedMembers').to.equal(2)
    })
  })
})
