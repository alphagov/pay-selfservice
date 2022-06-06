'use strict'

const sinon = require('sinon')
const { expect } = require('chai')
const controller = require('./post.controller')

describe('Check org details - post controller', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1',
        external_id: 'a-valid-external-id',
        connectorGatewayAccountStripeProgress: {}
      },
      service: {
        merchantDetails: {
          name: 'Test organisation',
          address_line1: 'Test address line 1',
          address_line2: 'Test address line 2',
          address_city: 'London',
          address_postcode: 'N1 1NN'
        }
      },
      user: {
        getPermissionsForService: sinon.stub().returns(null),
        isAdminUserForService: sinon.stub().returns(null)
      },
      flash: sinon.spy()
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }

    next = sinon.spy()
  })

  it('should render error page when stripe setup is not available on request', async () => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    controller(req, res, next)

    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Stripe setup progress is not available on request'))
    sinon.assert.calledWith(next, expectedError)
  })

  it('when organisation details are already provided, should display an error', async () => {
    req.account.connectorGatewayAccountStripeProgress = { organisationDetails: true }

    controller(req, res, next)

    sinon.assert.calledWith(res.render, 'error-with-link')
  })

  it('when no radio button is selected, then it should display the page with an error and the org name and address', async () => {
    req.account.connectorGatewayAccountStripeProgress = { organisationDetails: false }

    controller(req, res, next)

    const renderArgs = res.render.getCalls()[0]
    expect(renderArgs.args[0]).to.equal('stripe-setup/check-org-details/index')

    const pageData = renderArgs.args[1]
    expect(pageData.errors['confirmOrgDetails']).to.equal('Select yes if your organisation’s details match the details on your government entity document')
    expect(pageData.orgName).to.equal('Test organisation')
    expect(pageData.orgAddressLine1).to.equal('Test address line 1')
    expect(pageData.orgAddressLine2).to.equal('Test address line 2')
    expect(pageData.orgCity).to.equal('London')
    expect(pageData.orgPostcode).to.equal('N1 1NN')
  })
})
