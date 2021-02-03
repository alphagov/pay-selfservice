'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../paths')

describe('Company number POST controller', () => {
  const postBody = {
    'company-number-declaration': 'Yes',
    'company-number': '1234567890'
  }

  let req
  let next
  let res
  let setStripeAccountSetupFlagMock
  let updateCompanyMock

  function getControllerWithMocks () {
    return proxyquire('./post.controller', {
      '../../../services/clients/stripe/stripe.client': {
        updateCompany: updateCompanyMock
      },
      '../../../services/clients/connector.client': {
        ConnectorClient: function () {
          this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
          this.getStripeAccount = () => Promise.resolve({
            stripeAccountId: 'acct_123example123'
          })
        }
      }
    })
  }

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1',
        external_id: 'a-valid-external-id',
        connectorGatewayAccountStripeProgress: {}
      },
      flash: sinon.spy()
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy(),
      locals: {
        stripeAccount: {
          stripeAccountId: 'acct_123example123'
        }
      }
    }
    next = sinon.spy()
  })

  it('should call Stripe with company number, then connector, then redirect to add psp account details route', async function () {
    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res)

    sinon.assert.calledWith(updateCompanyMock, res.locals.stripeAccount.stripeAccountId, {
      'tax_id': '1234567890'
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'company_number', req.correlationId)
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`)
  })

  it('should render error page when stripe setup is not available on request', async () => {
    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = undefined

    await controller(req, res, next)

    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Stripe setup progress is not available on request'))
    sinon.assert.calledWith(next, expectedError)
  })

  it('should redirect to dashboard if company number is already provided ', async () => {
    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = { companyNumber: true }

    await controller(req, res)

    sinon.assert.calledWith(req.flash, 'genericError', 'You’ve already provided your company registration number. Contact GOV.UK Pay support if you need to update it.')
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id/dashboard`)
  })

  it('should render error when Stripe returns error, not call connector, and not redirect', async function () {
    updateCompanyMock = sinon.spy(() => Promise.reject(new Error()))
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res)

    sinon.assert.called(updateCompanyMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.notCalled(res.redirect)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error', sinon.match({ message: 'Please try again or contact support team' }))
  })

  it('should render error when connector returns error', async function () {
    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.reject(new Error()))
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res)

    sinon.assert.called(updateCompanyMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'company_number', req.correlationId)
    sinon.assert.notCalled(res.redirect)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error', sinon.match({ message: 'Please try again or contact support team' }))
  })
})
