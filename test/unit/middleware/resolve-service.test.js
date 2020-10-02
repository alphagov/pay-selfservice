'use strict'

// NPM modules
const sinon = require('sinon')

// Local modules
const resolveService = require('../../../app/middleware/resolve-service')
const userFixtures = require('../../fixtures/user.fixtures')

const buildUserWithGatewayAccountIds = (gatewayAccountIds) => {
  return userFixtures.validUserResponse({
    service_roles: [{
      service: {
        gateway_account_ids: gatewayAccountIds
      }
    }]
  }).getAsObject()
}

describe('resolve service middleware', () => {
  let res, nextSpy, user

  beforeEach(() => {
    res = { setHeader: sinon.spy(), status: sinon.spy(), render: sinon.spy() }
    nextSpy = sinon.spy()
    user = userFixtures.validUserResponse().getAsObject()
  })

  it('from externalServiceId in path param then remove it', () => {
    const req = { user: user, params: { externalServiceId: user.serviceRoles[0].service.externalId } }

    resolveService(req, res, nextSpy)

    expect(req.service).toEqual(user.serviceRoles[0].service)
    expect(req.params.externalServiceId).toBeUndefined() // Removing becuase we going forward we only want to resolve the service via req.service as this way we know the person authorised
    expect(nextSpy.called).toBe(true)
  })

  it(
    'from externalServiceId in path param but show unauthorised view if it does not belong to this user',
    () => {
      const req = { user: user, params: { externalServiceId: 'someoneElsesID' } }

      resolveService(req, res, nextSpy)

      expect(req.service).toBeUndefined()
      expect(res.status.calledWith(403))
      expect(res.render.calledWith('error'))
      expect(nextSpy.called).toBe(false)
    }
  )

  it('from gatewayAccountId in cookie', () => {
    const req = {
      user: user,
      params: {},
      gateway_account: {
        currentGatewayAccountId: user.serviceRoles[0].service.gatewayAccountIds[0]
      }
    }

    resolveService(req, res, nextSpy)

    expect(req.service).toEqual(user.serviceRoles[0].service)
    expect(nextSpy.called).toBe(true)
  })

  it(
    'from gatewayAccountId in cookie but if it does not match any of the users services kick back to first service they are a member of',
    () => {
      const req = {
        user: user,
        params: {},
        gateway_account: {
          currentGatewayAccountId: 'someoneElsesID'
        }
      }

      resolveService(req, res, nextSpy)

      expect(req.service).toEqual(user.serviceRoles[0].service)
      expect(nextSpy.called).toBe(true)
    }
  )

  it(
    'when user is not authorised to view any services show unauthorised page',
    () => {
      const req = { user: user, params: {} }
      user.serviceRoles = {} // remove all services from test user

      resolveService(req, res, nextSpy)

      expect(req.service).toBeUndefined()
      expect(res.status.calledWith(403))
      expect(res.render.calledWith('error'))
      expect(nextSpy.called).toBe(false)
    }
  )
})

describe('resolve types of gateway within a service', () => {
  let res, nextSpy

  beforeEach(() => {
    res = { render: sinon.spy() }
    nextSpy = sinon.spy()
  })

  it(
    'service.hasDirectDebitGatewayAccount is true and service.hasCardGatewayAccount is false when we have Direct Debit gateway accounts only',
    () => {
      const user = buildUserWithGatewayAccountIds(['DIRECT_DEBIT:randomidhere'])
      const req = { user: user, params: { externalServiceId: user.serviceRoles[0].service.externalId } }

      resolveService(req, res, nextSpy)

      expect(req.service.hasDirectDebitGatewayAccount).toBe(true)
      expect(req.service.hasCardGatewayAccount).toBe(false)
      expect(req.service.hasCardAndDirectDebitGatewayAccount).toBe(false)
      expect(nextSpy.called).toBe(true)
    }
  )

  it(
    'service.hasCardGatewayAccount is true and service.hasDirectDebitGatewayAccount is false when we have Card gateway accounts only',
    () => {
      const user = buildUserWithGatewayAccountIds(['7127217'])
      const req = { user: user, params: { externalServiceId: user.serviceRoles[0].service.externalId } }

      resolveService(req, res, nextSpy)

      expect(req.service.hasCardGatewayAccount).toBe(true)
      expect(req.service.hasDirectDebitGatewayAccount).toBe(false)
      expect(req.service.hasCardAndDirectDebitGatewayAccount).toBe(false)
      expect(nextSpy.called).toBe(true)
    }
  )

  it(
    'service.hasCardAndDirectDebitGatewayAccount is true when we have Direct Debit and Card gateway accounts',
    () => {
      const user = buildUserWithGatewayAccountIds(['7127217', 'DIRECT_DEBIT:randomidhere'])
      const req = { user: user, params: { externalServiceId: user.serviceRoles[0].service.externalId } }

      resolveService(req, res, nextSpy)

      expect(req.service.hasCardAndDirectDebitGatewayAccount).toBe(true)
      expect(req.service.hasCardGatewayAccount).toBe(false)
      expect(req.service.hasDirectDebitGatewayAccount).toBe(false)
      expect(nextSpy.called).toBe(true)
    }
  )
})
