'use strict'

const sinon = require('sinon')
const { expect } = require('chai')

const getPermissionMiddleware = require('../../../app/middleware/permission')
const { PermissionDeniedError } = require('../../../app/errors')
const User = require('../../../app/models/User.class')
const userFixtures = require('../../fixtures/user.fixtures')
const serviceFixtures = require('../../fixtures/service.fixtures')

const serviceExternalId = 'a-service-external-id'
const permission = 'do-cool-things'

const service = serviceFixtures.validServiceResponse({
  external_id: serviceExternalId
}).getAsObject()

const userWithPermissionForService = new User(userFixtures.validUserResponse({
  service_roles: [{
    service: {
      external_id: serviceExternalId
    },
    role: {
      permissions: [{ name: permission }]
    }
  }]
}))

const userWithPermissionForDifferentService = new User(userFixtures.validUserResponse({
  service_roles: [
    {
      service: {
        external_id: serviceExternalId
      },
      role: {
        permissions: [{ name: 'a-different-permission' }]
      }
    },
    {
      service: {
        external_id: 'a-different-service-id'
      },
      role: {
        permissions: [{ name: permission }]
      }
    }
  ]
}))

const res = {}
let next

describe('Permission check middleware', () => {
  beforeEach(() => {
    next = sinon.spy()
  })

  describe('middleware has permission to check', () => {
    const middleware = getPermissionMiddleware(permission)[1]

    describe('user does not have permission for service', () => {
      it('should throw an error', () => {
        const req = {
          user: userWithPermissionForDifferentService,
          service
        }

        middleware(req, res, next)

        const expectedError = sinon.match.instanceOf(PermissionDeniedError)
          .and(sinon.match.has('message', `User does not have permission ${permission} for service`))
        sinon.assert.calledWith(next, expectedError)
      })
    })

    describe('user has permission for service', () => {
      it('should call next without arguments', () => {
        const req = {
          user: userWithPermissionForService,
          service
        }

        middleware(req, res, next)

        sinon.assert.calledOnce(next)
        expect(next.firstCall.args).to.have.length(0)
      })
    })
  })

  describe('middleware does not have permission to check', () => {
    const middleware = getPermissionMiddleware()[1]
    it('should call next without arguments', () => {
      const req = {
        user: userWithPermissionForDifferentService,
        service
      }

      middleware(req, res, next)

      sinon.assert.calledOnce(next)
      expect(next.firstCall.args).to.have.length(0)
    })
  })
})
