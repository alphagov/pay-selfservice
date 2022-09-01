'use strict'

const sinon = require('sinon')
const { expect } = require('chai')
const getController = require('./get.controller')
const Service = require('../../../models/Service.class')
const User = require('../../../models/User.class')
const serviceFixtures = require('../../../../test/fixtures/service.fixtures')
const userFixtures = require('../../../../test/fixtures/user.fixtures')
const gatewayAccountFixture = require('../../../../test/fixtures/gateway-account.fixtures')

describe('Check org details - get controller', () => {
  let req
  let res
  let next

  const service = new Service(serviceFixtures.validServiceResponse({
    merchant_details: {
      name: 'Test organisation',
      address_line1: 'Test address line 1',
      address_line2: 'Test address line 2',
      address_city: 'London',
      address_postcode: 'N1 1NN'
    }
  }))

  const user = new User(userFixtures.validUserResponse())

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: gatewayAccountFixture.validGatewayAccount({}),
      flash: sinon.spy(),
      service: service,
      user: user
    }
    res = {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should render error page when stripe setup is not available on request', async () => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    await getController(req, res, next)

    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Stripe setup progress is not available on request'))
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render error if organisation details have already been submitted', async () => {
    req.account.connectorGatewayAccountStripeProgress = { organisationDetails: true }

    await getController(req, res)

    sinon.assert.calledWith(res.render, 'error-with-link')
  })

  it('should render `check your organisation` form if details are not yet submitted with the org name and address', async () => {
    req.account.connectorGatewayAccountStripeProgress = { organisationDetails: false }

    await getController(req, res)

    const renderArgs = res.render.getCalls()[0]
    expect(renderArgs.args[0]).to.equal('stripe-setup/check-org-details/index')

    const pageData = renderArgs.args[1]
    expect(pageData.orgName).to.equal('Test organisation')
    expect(pageData.orgAddressLine1).to.equal('Test address line 1')
    expect(pageData.orgAddressLine2).to.equal('Test address line 2')
    expect(pageData.orgCity).to.equal('London')
    expect(pageData.orgPostcode).to.equal('N1 1NN')
  })

  it('should render `check your organisation` form if details are not yet submitted and the `merchantDetails` is empty', async () => {
    const updatedService = { ...req.service, merchantDetails: undefined }
    req.service = updatedService

    req.account.connectorGatewayAccountStripeProgress = { organisationDetails: false }

    await getController(req, res)

    const renderArgs = res.render.getCalls()[0]
    expect(renderArgs.args[0]).to.equal('stripe-setup/check-org-details/index')

    const pageData = renderArgs.args[1]
    expect(pageData.orgName).to.equal('')
    expect(pageData.orgAddressLine1).to.equal('')
    expect(pageData.orgAddressLine2).to.equal('')
    expect(pageData.orgCity).to.equal('')
    expect(pageData.orgPostcode).to.equal('')
  })

  it('should render `check your organisation` form if details are not yet submitted and only the `merchantDetails.name` is empty', async () => {
    const updatedService = { ...req.service }
    updatedService.merchantDetails.name = undefined
    req.service = updatedService

    req.account.connectorGatewayAccountStripeProgress = { organisationDetails: false }

    await getController(req, res)

    const renderArgs = res.render.getCalls()[0]
    expect(renderArgs.args[0]).to.equal('stripe-setup/check-org-details/index')

    const pageData = renderArgs.args[1]
    expect(pageData.orgName).to.equal('')
    expect(pageData.orgAddressLine1).to.equal('Test address line 1')
    expect(pageData.orgAddressLine2).to.equal('Test address line 2')
    expect(pageData.orgCity).to.equal('London')
    expect(pageData.orgPostcode).to.equal('N1 1NN')
  })
})
