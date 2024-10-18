const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

let req, res, responseStub, getServiceUsersStub, getInvitedUsersStub, teamMembersController

const getController = (stubs = {}) => {
  return proxyquire('./team-members.controller', {
    '../../../../utils/response': { response: stubs.response },
    '../../../../services/user.service':
      { getServiceUsers: stubs.getServiceUsers,
        getInvitedUsers: stubs.getInvitedUsers },
    '../../../../utils/simplified-account/format/arrange-users-by-role':
      { mapTeamMembersByRoles: stubs.mapTeamMembersByRoles,
        mapInvitedTeamMembersByRoles: stubs.mapInvitedTeamMembersByRoles }
  })
}

const setupTest = (method, additionalReqProps = {}, additionalStubs = {}) => {
  responseStub = sinon.spy()
  getServiceUsersStub = sinon.stub().resolves([])
  getInvitedUsersStub = sinon.stub().resolves([{}])
  mapTeamMembersByRolesStub = sinon.stub().returns(
    { 'admin': { members: [ { email: 'user@user.gov.uk' } ] }})
  mapInvitedTeamMembersByRolesStub = sinon.stub().returns({ 'view-only': { members: [] }})
  teamMembersController = getController({
    response: responseStub,
    getServiceUsers: getServiceUsersStub,
    getInvitedUsers: getInvitedUsersStub,
    mapTeamMembersByRoles: mapTeamMembersByRolesStub,
    mapInvitedTeamMembersByRoles: mapInvitedTeamMembersByRolesStub,
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
      expect(getServiceUsersStub.called).to.be.true
      expect(responseStub.args[0]).to.include(req)
      expect(responseStub.args[0]).to.include(res)
      expect(responseStub.args[0]).to.include('simplified-account/settings/team-members/index')
    })

    it(`should pass context data to the response method`, () => {
      expect(responseStub.args[0][3]).to.have.property('team_members')
        .to.have.property('admin')
        .to.have.property('members')
        .to.have.length(1)
        .to.deep.include({email: 'user@user.gov.uk'})
      expect(responseStub.args[0][3]).to.have.property('invited_team_members')
        .to.have.property('view-only')
        .to.have.property('members')
        .to.have.length(0)
      expect(responseStub.args[0][3]).to.have.property('inviteTeamMemberLink')
        .to.equal('/simplified/service/service-id-123abc/account/test/team-members/invite')
      expect(responseStub.args[0][3]).to.have.property('number_invited_members').to.equal(1)
    })
  })
})
