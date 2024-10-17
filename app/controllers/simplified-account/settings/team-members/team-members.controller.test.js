const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../../paths')
const { expect } = require('chai')
const User = require('../../../../models/User.class')
const { mapServiceUsersByRoles, mapInvitedUsersByRoles } = require('../../../../utils/simplified-account/format/arrange-users-by-role')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

let req, res, responseStub, getServiceUsersStub, getInvitedUsers, teamMembersController

const getController = (stubs = {}) => {
  return proxyquire('./team-members.controller', {
    '../../../../utils/response': { response: stubs.response },
    '../../../../services/user.service': { getServiceUsers: stubs.getServiceUsers, getInvitedUsers: stubs.getInvitedUsers },
    '../../../../utils/simplified-account/format/arrange-users-by-role': { mapServiceUsersByRoles: stubs.mapServiceUsersByRoles, mapInvitedUsersByRoles: stubs.mapInvitedUsersByRoles }
  })
}

const setupTest = (method, additionalReqProps = {}, additionalStubs = {}) => {
  responseStub = sinon.spy()
  getServiceUsersStub = sinon.stub().resolves([])
  getInvitedUsersStub = sinon.stub().resolves([{}])
  mapServiceUsersByRolesStub = sinon.stub().returns({ admin:
      [ { email: 'user@user.gov.uk', external_id: 'valid-user-external-id' }]
  })
  mapInvitedUsersByRolesStub = sinon.stub().returns({ admin:
      [ { email: 'invited_user@user.gov.uk', expired: false } ]
  })
  teamMembersController = getController({
    response: responseStub,
    getServiceUsers: getServiceUsersStub,
    getInvitedUsers: getInvitedUsersStub,
    mapServiceUsersByRoles: mapServiceUsersByRolesStub,
    mapInvitedUsersByRoles: mapInvitedUsersByRolesStub,
    ...additionalStubs
  })
  res = {
    redirect: sinon.spy()
  }
  req = {
    user: {},
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
      expect(responseStub.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0]).to.include(req)
      expect(responseStub.args[0]).to.include(res)
      expect(responseStub.args[0]).to.include('simplified-account/settings/team-members/index')
      console.log("Response Stub args[0]: ")
      console.log(responseStub.args[0])
    })

    it(`should pass context data to the response method`, () => {
      expect(responseStub.args[0][3]).to.have.property('team_members').to.have.property('admin').to.deep.include({
        email: 'user@user.gov.uk',
        external_id: 'valid-user-external-id'
      })
      expect(responseStub.args[0][3]).to.have.property('invited_team_members').to.have.property('admin').to.deep.include({
        email: 'invited_user@user.gov.uk', expired: false
      })
      expect(responseStub.args[0][3]).to.have.property('inviteTeamMemberLink').to.equal('/simplified/service/service-id-123abc/account/test/team-members/invite')
      expect(responseStub.args[0][3]).to.have.property('number_invited_members').to.equal(1)
    })
  })
})
