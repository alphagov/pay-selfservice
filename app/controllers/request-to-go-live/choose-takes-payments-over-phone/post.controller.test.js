'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')

const User = require('../../../models/User.class')
const userFixtures = require('../../../../test/fixtures/user.fixtures')
const { expect } = require('chai')
const { GOV_BANKING_MOTO_OPTION_COMPLETED } = require('../../../models/go-live-stage')

let updateServiceMock, updateCurrentGoLiveStageMock
let mockResponse

function postControllerWithMocks () {
  return proxyquire('./post.controller.js', {
    '../../../services/service.service': {
      updateCurrentGoLiveStage: updateCurrentGoLiveStageMock,
      updateService: updateServiceMock
    },
    '../../../utils/response': {
      response: mockResponse
    }
  })
}

describe('Request to go live - choose takes payments over phone - POST', () => {
  let req, res, next

  const user = new User(userFixtures.validUserResponse())
  const service = user.serviceRoles[0].service

  beforeEach(() => {
    req = {
      user,
      service: service,
      body: {}
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
    mockResponse = sinon.spy()
    updateCurrentGoLiveStageMock = sinon.spy(() => Promise.resolve())
    updateServiceMock = sinon.spy(() => Promise.resolve())
  })

  it('should redirect to `agreement` page when `choose-takes-payments-over-phone` is true', async () => {
    req.body['choose-takes-payments-over-phone'] = 'true'

    await postControllerWithMocks()(req, res, next)

    sinon.assert.calledWith(res.redirect, 303, `/service/${service.externalId}/request-to-go-live/agreement`)
    sinon.assert.calledWith(updateCurrentGoLiveStageMock, service.externalId, GOV_BANKING_MOTO_OPTION_COMPLETED)
    sinon.assert.calledWith(updateServiceMock, service.externalId, [{
      op: 'replace',
      path: 'takes_payments_over_phone',
      value: true
    }])
  })

  it('should patch service correctly when `choose-takes-payments-over-phone` is false', async () => {
    req.body['choose-takes-payments-over-phone'] = 'false'

    await postControllerWithMocks()(req, res, next)

    sinon.assert.calledWith(res.redirect, 303, `/service/${service.externalId}/request-to-go-live/agreement`)
    sinon.assert.calledWith(updateCurrentGoLiveStageMock, service.externalId, GOV_BANKING_MOTO_OPTION_COMPLETED)
    sinon.assert.calledWith(updateServiceMock, service.externalId, [{
      op: 'replace',
      path: 'takes_payments_over_phone',
      value: false
    }])
  })

  it('should return error if `choose-takes-payments-over-phone` field is not available in request body', async () => {
    req.body['choose-takes-payments-over-phone'] = undefined

    await postControllerWithMocks()(req, res, next)

    sinon.assert.notCalled(res.redirect)

    const responseData = mockResponse.getCalls()[0]
    expect(responseData.args[2]).to.equal('request-to-go-live/choose-takes-payments-over-phone')

    const errors = responseData.lastArg.errors
    expect(errors['choose-takes-payments-over-phone']).to.equal('You need to select an option')
  })

  it('should return error if `choose-takes-payments-over-phone` field is empty', async () => {
    req.body['choose-takes-payments-over-phone'] = ''

    await postControllerWithMocks()(req, res, next)

    sinon.assert.notCalled(res.redirect)

    const responseData = mockResponse.getCalls()[0]
    expect(responseData.args[2]).to.equal('request-to-go-live/choose-takes-payments-over-phone')

    const errors = responseData.lastArg.errors
    expect(errors['choose-takes-payments-over-phone']).to.equal('You need to select an option')
  })

  it('should return error when adminusers returns error for `updateService`', async () => {
    const error = new Error('adminusers error')
    req.body['choose-takes-payments-over-phone'] = 'true'

    updateServiceMock = sinon.spy(() => Promise.reject(error))

    await postControllerWithMocks()(req, res, next)

    sinon.assert.calledWith(next, error)
  })

  it('should return error when adminusers returns error for `updateCurrentGoLiveStageMock`', async () => {
    const error = new Error('adminusers error')
    req.body['choose-takes-payments-over-phone'] = 'true'

    updateCurrentGoLiveStageMock = sinon.spy(() => Promise.reject(error))

    await postControllerWithMocks()(req, res, next)

    sinon.assert.calledWith(next, error)
  })
})
