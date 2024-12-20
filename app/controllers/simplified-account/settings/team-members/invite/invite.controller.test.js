const sinon = require('sinon')
const { expect } = require('chai')
const proxyquire = require('proxyquire')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')
const paths = require('@root/paths')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

let req, res, responseStub, createInviteToJoinServiceStub, inviteController

const getController = (stubs = {}) => {
  return proxyquire('./invite.controller', {
    '@utils/response': { response: stubs.response, renderErrorView: stubs.renderErrorView },
    '@services/user.service': { createInviteToJoinService: stubs.createInviteToJoinService }
  })
}

const adminUser = new User(userFixtures.validUserResponse({
  external_id: 'user-id-for-admin-user',
  email: 'admin-user@users.gov.uk',
  service_roles: {
    service: {
      service: { external_id: SERVICE_ID },
      role: { name: 'admin' }
    }
  }
}))

const setupTest = (method, adminusers412Response, additionalReqProps = {}) => {
  responseStub = sinon.spy()
  createInviteToJoinServiceStub = sinon.stub()
  if (adminusers412Response) {
    createInviteToJoinServiceStub.rejects(new RESTClientError(null, 'adminusers', 412))
  }

  inviteController = getController({
    response: responseStub,
    createInviteToJoinService: createInviteToJoinServiceStub
  })
  res = {
    redirect: sinon.spy()
  }
  req = {
    user: adminUser,
    service: {
      externalId: SERVICE_ID
    },
    account: {
      type: ACCOUNT_TYPE
    },
    ...additionalReqProps
  }
  inviteController[method](req, res)
}

describe('Controller: settings/team-members/invite', () => {
  describe('get', () => {
    before(() => setupTest('get'))

    it('should call the response method', () => {
      expect(responseStub.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0][0]).to.deep.equal(req)
      expect(responseStub.args[0][1]).to.deep.equal(res)
      expect(responseStub.args[0][2]).to.equal('simplified-account/settings/team-members/invite')
    })

    it('should pass context data to the response method', () => {
      expect(responseStub.args[0][3]).to.have.property('availableRoles').to.have.length(3)
      expect(responseStub.args[0][3]).to.have.property('backLink').to.equal('/simplified/service/service-id-123abc/account/test/settings/team-members')
    })
  })

  describe('post', () => {
    describe('success', () => {
      before(() => setupTest('post', false,
        {
          body: { invitedUserEmail: 'user-to-invite@users.gov.uk', invitedUserRole: 'view-only' },
          flash: sinon.stub()
        }
      ))

      it('should call adminusers to send an invite', () => {
        expect(createInviteToJoinServiceStub.calledWith('user-to-invite@users.gov.uk', adminUser.externalId, SERVICE_ID, 'view-only')).to.be.true // eslint-disable-line
      })

      it('should redirect to the team members index page', () => {
        sinon.assert.calledWith(req.flash, 'messages', {
          state: 'success',
          icon: '&check;',
          heading: 'Team member invitation sent to user-to-invite@users.gov.uk'
        })
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.teamMembers.index)
      })
    })

    describe('failure - user already in service', () => {
      before(() => setupTest('post', true,
        {
          body: { invitedUserEmail: 'user-to-invite@users.gov.uk', invitedUserRole: 'view-only' },
          flash: sinon.stub()
        }
      ))

      it('should respond with error message', () => {
        expect(createInviteToJoinServiceStub.calledWith('user-to-invite@users.gov.uk', adminUser.externalId, SERVICE_ID, 'view-only')).to.be.true // eslint-disable-line
        expect(responseStub.calledOnce).to.be.true // eslint-disable-line
        expect(responseStub.args[0][0]).to.deep.equal(req)
        expect(responseStub.args[0][1]).to.deep.equal(res)
        expect(responseStub.args[0][2]).to.equal('simplified-account/settings/team-members/invite')
        expect(responseStub.args[0][3]).to.have.property('errors').to.deep.equal({
          summary: [{ text: 'This person has already been invited', href: '#invited-user-email' }],
          formErrors: { invitedUserEmail: `You cannot send an invitation to ${req.body.invitedUserEmail} because they have received one already, or may be an existing team member` }
        })
      })
    })
  })
})
