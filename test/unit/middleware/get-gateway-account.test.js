'use strict'

const path = require('path')
const proxyquire = require('proxyquire')
const lodash = require('lodash')
const sinon = require('sinon')
const { expect } = require('chai')

let req, res, next, connectorGetAccountMock

const connectorMock = {
  ConnectorClient: function () {
    this.getAccount = connectorGetAccountMock
  }
}
const setupGetGatewayAccount = function (currentGatewayAccountID, paymentProvider) {
  const authServiceMock = { getCurrentGatewayAccountId: () => currentGatewayAccountID }
  req = {
    correlationId: 'sdfghjk'
  }
  res = {
    redirect: sinon.spy()
  }
  next = sinon.spy()
  connectorGetAccountMock = sinon.spy((params) => {
    return Promise.resolve({
      id: params.gatewayAccountId,
      payment_provider: paymentProvider
    })
  })

  return proxyquire(path.join(__dirname, '../../../app/middleware/get-gateway-account'), {
    '../services/auth.service.js': authServiceMock,
    '../services/clients/connector.client.js': connectorMock
  })
}

describe('middleware: getGatewayAccount', () => {
  it('should call connectorClient.getAccount if it can resolve a currentGatewayAccountId', done => {
    lodash.set(req, 'user.serviceRoles[0]', { gatewayAccountIds: ['1', '2', '3'] })
    const getGatewayAccount = setupGetGatewayAccount('1', 'worldpay')
    next = function () {
      expect(connectorGetAccountMock.called).to.equal(true)
      expect(connectorGetAccountMock.calledWith({ gatewayAccountId: '1', correlationId: 'sdfghjk' })).to.equal(true)
      expect(res.redirect.called).to.equal(false)
      done()
    }
    getGatewayAccount(req, res, next)
  })
  it('should extend the account data with supports3ds set to true if the account type is worldpay', done => {
    lodash.set(req, 'user.serviceRoles[0]', { gatewayAccountIds: ['1', '2', '3'] })
    const getGatewayAccount = setupGetGatewayAccount('1', 'worldpay')
    next = function () {
      expect(req.account).to.deep.equal({ id: '1', payment_provider: 'worldpay', supports3ds: true, disableToggle3ds: false })
      done()
    }
    getGatewayAccount(req, res, next)
  })
  it('should extend the account data with supports3ds set to true if the account type is epdq', done => {
    lodash.set(req, 'user.serviceRoles[0]', { gatewayAccountIds: ['1', '2', '3'] })
    const getGatewayAccount = setupGetGatewayAccount('1', 'epdq')
    next = function () {
      expect(req.account).to.deep.equal({ id: '1', payment_provider: 'epdq', supports3ds: true, disableToggle3ds: false })
      done()
    }
    getGatewayAccount(req, res, next)
  })
  it('should not extend the account data with supports3ds set to true if the account type is smartpay', done => {
    lodash.set(req, 'user.serviceRoles[0]', { gatewayAccountIds: ['1', '2', '3'] })
    const getGatewayAccount = setupGetGatewayAccount('1', 'smartpay')
    next = function () {
      expect(req.account).to.deep.equal({ id: '1', payment_provider: 'smartpay', supports3ds: true, disableToggle3ds: false })
      done()
    }
    getGatewayAccount(req, res, next)
  })
  it('should extend the account data with supports3ds set to true if the account type is stripe', done => {
    lodash.set(req, 'user.serviceRoles[0]', { gatewayAccountIds: ['1', '2', '3'] })
    const getGatewayAccount = setupGetGatewayAccount('1', 'stripe')
    next = function () {
      expect(req.account).to.deep.equal({ id: '1', payment_provider: 'stripe', supports3ds: true, disableToggle3ds: true })
      done()
    }
    getGatewayAccount(req, res, next)
  })
  describe('middleware: getGatewayAccount - disableToggle3ds flag by payment provider', () => {
    ['worldpay', 'smartpay', 'epdq'].forEach(function (value) {
      it('should extend the account data with disableToggle3ds set to false if the account type is ' + value, done => {
        lodash.set(req, 'user.serviceRoles[0]', { gatewayAccountIds: ['1', '2', '3'] })
        const getGatewayAccount = setupGetGatewayAccount('1', value)
        next = function () {
          expect(req.account).to.deep.equal({
            id: '1',
            payment_provider: value,
            supports3ds: true,
            disableToggle3ds: false
          })
          done()
        }
        getGatewayAccount(req, res, next)
      })
    })
    it('should extend the account data with disableToggle3ds set to true if the account type is stripe', done => {
      lodash.set(req, 'user.serviceRoles[0]', { gatewayAccountIds: ['1', '2', '3'] })
      const getGatewayAccount = setupGetGatewayAccount('1', 'stripe')
      next = function () {
        expect(req.account).to.deep.equal({ id: '1', payment_provider: 'stripe', supports3ds: true, disableToggle3ds: true })
        done()
      }
      getGatewayAccount(req, res, next)
    })
  })
})
