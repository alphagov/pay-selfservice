'use strict'

const sinon = require('sinon')
const { expect } = require('chai')
const { NotAuthorisedError, NotAuthenticatedError, UserAccountDisabledError } = require('../errors')
const userIsAuthorised = require('./user-is-authorised')
const User = require('../models/User.class')
const Service = require('../models/Service.class')
const userFixtures = require('../../test/fixtures/user.fixtures')
const serviceFixtures = require('../../test/fixtures/service.fixtures')

const serviceExternalId = 'a-service-external-id'
const sessionVersion = 1
const loggedInSession = { version: sessionVersion, secondFactor: 'totp' }
const authorisedUser = new User(userFixtures.validUserResponse({
  session_version: sessionVersion,
  service_roles: [{
    service: {
      external_id: serviceExternalId
    }
  }]
}))

const userWithoutServiceRole = new User(userFixtures.validUserResponse({
  session_version: sessionVersion,
  service_roles: [{
    service: { external_id: 'some-other-service-id' }
  }]
}))

const service = new Service(serviceFixtures.validServiceResponse({
  external_id: serviceExternalId
}))

const res = {}
let next

describe('User is authorised middleware', () => {
  beforeEach(() => {
    next = sinon.spy()
  })

  describe('User is not authenticated', () => {
    describe('there is no user object on the request', () => {
      it('should call next with error', () => {
        const req = {
          session: {},
          params: {}
        }

        userIsAuthorised(req, res, next)

        const expectedError = sinon.match.instanceOf(NotAuthenticatedError)
          .and(sinon.match.has('message', 'User not found on request'))
        sinon.assert.calledWith(next, expectedError)
      })
    })

    describe('there is no session object on the request', () => {
      it('should call next with error', () => {
        const req = {
          user: {},
          params: {}
        }

        userIsAuthorised(req, res, next)

        const expectedError = sinon.match.instanceOf(NotAuthenticatedError)
          .and(sinon.match.has('message', 'Session not found on request'))
        sinon.assert.calledWith(next, expectedError)
      })
    })

    describe('session version does not match user session version', () => {
      it('should call next with error', () => {
        const req = {
          session: { version: 1 },
          user: new User(userFixtures.validUserResponse({ session_version: 2 })),
          params: {}
        }

        userIsAuthorised(req, res, next)

        const expectedError = sinon.match.instanceOf(NotAuthenticatedError)
          .and(sinon.match.has('message', 'Invalid session version - session version is 1, user session version is 2'))
        sinon.assert.calledWith(next, expectedError)
      })
    })

    describe('user has not completed second factor authentication', () => {
      it('should call next with error', () => {
        const req = {
          session: { version: sessionVersion },
          user: authorisedUser,
          params: {}
        }

        userIsAuthorised(req, res, next)

        const expectedError = sinon.match.instanceOf(NotAuthenticatedError)
          .and(sinon.match.has('message', 'Not completed second factor authentication'))
        sinon.assert.calledWith(next, expectedError)
      })
    })

    describe('user account is disabled', () => {
      it('should call next with error', () => {
        const userOpts = {
          session_version: sessionVersion,
          disabled: true
        }
        const req = {
          session: loggedInSession,
          user: new User(userFixtures.validUserResponse(userOpts)),
          params: {}
        }

        userIsAuthorised(req, res, next)

        const expectedError = sinon.match.instanceOf(UserAccountDisabledError)
        sinon.assert.calledWith(next, expectedError)
      })
    })
  })

  describe('there is no service id or gateway account id path param', () => {
    it('should call next without arguments', () => {
      const req = {
        session: loggedInSession,
        user: authorisedUser,
        params: {}
      }

      userIsAuthorised(req, res, next)

      sinon.assert.calledOnce(next)
      expect(next.firstCall.args).to.have.length(0)
    })
  })

  describe('there is a gateway account id path param but no service object on request', () => {
    it('should throw an error', () => {
      const req = {
        session: loggedInSession,
        user: authorisedUser,
        params: { gatewayAccountExternalId: 'a-gateway-account-id' }
      }

      userIsAuthorised(req, res, next)

      const expectedError = sinon.match.instanceOf(NotAuthorisedError)
        .and(sinon.match.has('message', 'Service not found on request'))
      sinon.assert.calledWith(next, expectedError)
    })
  })

  describe('there is a service id path param but no service object on request', () => {
    it('should throw an error', () => {
      const req = {
        session: loggedInSession,
        user: authorisedUser,
        params: { serviceExternalId }
      }

      userIsAuthorised(req, res, next)

      const expectedError = sinon.match.instanceOf(NotAuthorisedError)
        .and(sinon.match.has('message', 'Service not found on request'))
      sinon.assert.calledWith(next, expectedError)
    })
  })

  describe('there is a service id path param and user does not have service role for service', () => {
    it('should throw an error', () => {
      const req = {
        session: loggedInSession,
        user: userWithoutServiceRole,
        params: { serviceExternalId },
        service
      }

      userIsAuthorised(req, res, next)

      const expectedError = sinon.match.instanceOf(NotAuthorisedError)
        .and(sinon.match.has('message', 'User does not have service role for service'))
      sinon.assert.calledWith(next, expectedError)
    })
  })

  describe('there is a service id path param and user has service role for service', () => {
    it('should call next without arguments', () => {
      const req = {
        session: loggedInSession,
        user: authorisedUser,
        params: { serviceExternalId },
        service
      }

      userIsAuthorised(req, res, next)

      sinon.assert.calledOnce(next)
      expect(next.firstCall.args).to.have.length(0)
    })
  })
})
