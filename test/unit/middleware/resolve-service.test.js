'use strict'

// NPM modules
const sinon = require('sinon')
const { expect } = require('chai')

// Local modules
const resolveService = require('../../../app/middleware/resolve-service')
const User = require('../../../app/models/User.class')
const userFixtures = require('../../fixtures/user.fixtures')

const buildUserWithGatewayAccountIds = (gatewayAccountIds) => {
  return new User(userFixtures.validUserResponse({
    service_roles: [{
      service: {
        gateway_account_ids: gatewayAccountIds
      }
    }]
  }))
}

describe('resolve service middleware', () => {
  let res, nextSpy, user

  beforeEach(() => {
    res = { setHeader: sinon.spy(), status: sinon.spy(), render: sinon.spy() }
    nextSpy = sinon.spy()
    user = new User(userFixtures.validUserResponse())
  })

  it('from externalServiceId in path param then remove it', () => {
    const req = { user: user, params: { externalServiceId: user.serviceRoles[0].service.externalId } }

    resolveService(req, res, nextSpy)

    expect(req.service).to.deep.equal(user.serviceRoles[0].service)
    expect(req.params.externalServiceId).to.equal(undefined) // Removing becuase we going forward we only want to resolve the service via req.service as this way we know the person authorised
    expect(nextSpy.called).to.equal(true)
  })

  it('from externalServiceId in path param but show unauthorised view if it does not belong to this user', () => {
    const req = { user: user, params: { externalServiceId: 'someoneElsesID' } }

    resolveService(req, res, nextSpy)

    expect(req.service).to.equal(undefined)
    expect(res.status.calledWith(403))
    expect(res.render.calledWith('error'))
    expect(nextSpy.called).to.equal(false)
  })

  it('from gatewayAccountId in cookie', () => {
    const req = {
      user: user,
      params: {},
      gateway_account: {
        currentGatewayAccountId: user.serviceRoles[0].service.gatewayAccountIds[0]
      }
    }

    resolveService(req, res, nextSpy)

    expect(req.service).to.deep.equal(user.serviceRoles[0].service)
    expect(nextSpy.called).to.equal(true)
  })

  it('from gatewayAccountId in cookie but if it does not match any of the users services kick back to first service they are a member of', () => {
    const req = {
      user: user,
      params: {},
      gateway_account: {
        currentGatewayAccountId: 'someoneElsesID'
      }
    }

    resolveService(req, res, nextSpy)

    expect(req.service).to.deep.equal(user.serviceRoles[0].service)
    expect(nextSpy.called).to.equal(true)
  })

  it('when user is not authorised to view any services show unauthorised page', () => {
    const req = { user: user, params: {} }
    user.serviceRoles = {} // remove all services from test user

    resolveService(req, res, nextSpy)

    expect(req.service).to.equal(undefined)
    expect(res.status.calledWith(403))
    expect(res.render.calledWith('error'))
    expect(nextSpy.called).to.equal(false)
  })
})

describe('resolve types of gateway within a service', () => {
  let res, nextSpy

  beforeEach(() => {
    res = { render: sinon.spy() }
    nextSpy = sinon.spy()
  })

  it('service.hasDirectDebitGatewayAccount is true and service.hasCardGatewayAccount is false when we have Direct Debit gateway accounts only', () => {
    const user = buildUserWithGatewayAccountIds(['DIRECT_DEBIT:randomidhere'])
    const req = { user: user, params: { externalServiceId: user.serviceRoles[0].service.externalId } }

    resolveService(req, res, nextSpy)

    expect(req.service.hasDirectDebitGatewayAccount).to.be.equal(true)
    expect(req.service.hasCardGatewayAccount).to.be.equal(false)
    expect(req.service.hasCardAndDirectDebitGatewayAccount).to.be.equal(false)
    expect(nextSpy.called).to.equal(true)
  })

  it('service.hasCardGatewayAccount is true and service.hasDirectDebitGatewayAccount is false when we have Card gateway accounts only', () => {
    const user = buildUserWithGatewayAccountIds(['7127217'])
    const req = { user: user, params: { externalServiceId: user.serviceRoles[0].service.externalId } }

    resolveService(req, res, nextSpy)

    expect(req.service.hasCardGatewayAccount).to.be.equal(true)
    expect(req.service.hasDirectDebitGatewayAccount).to.be.equal(false)
    expect(req.service.hasCardAndDirectDebitGatewayAccount).to.be.equal(false)
    expect(nextSpy.called).to.equal(true)
  })

  it('service.hasCardAndDirectDebitGatewayAccount is true when we have Direct Debit and Card gateway accounts', () => {
    const user = buildUserWithGatewayAccountIds(['7127217', 'DIRECT_DEBIT:randomidhere'])
    const req = { user: user, params: { externalServiceId: user.serviceRoles[0].service.externalId } }

    resolveService(req, res, nextSpy)

    expect(req.service.hasCardAndDirectDebitGatewayAccount).to.be.equal(true)
    expect(req.service.hasCardGatewayAccount).to.be.equal(false)
    expect(req.service.hasDirectDebitGatewayAccount).to.be.equal(false)
    expect(nextSpy.called).to.equal(true)
  })
})
