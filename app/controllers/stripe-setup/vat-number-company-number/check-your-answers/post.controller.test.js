'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../../paths')

describe('"VAT number / company number - check your answers" post controller', () => {
  const rawVatNumber = 'GB999 9999 73'
  const rawCompanyNumber = '01234567'
  const sanitisedVatNumber = 'GB999999973'
  const sanitisedCompanyNumber = '01234567'

  let req
  let res
  let setStripeAccountSetupFlagMock
  let updateCompanyMock

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1'
      },
      session: {
        pageData: {
          stripeSetup: {
            vatNumberData: {
              errors: {},
              vatNumber: rawVatNumber
            },
            companyNumberData: {
              errors: {},
              companyNumberDeclaration: 'true',
              companyNumber: rawCompanyNumber
            }
          }
        }
      }
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

    process.env.ENABLE_ACCOUNT_STATUS_PANEL = true
  })

  it('should redirect to the dashboard if feature flag disabled', async () => {
    process.env.ENABLE_ACCOUNT_STATUS_PANEL = false

    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res)

    sinon.assert.calledWith(updateCompanyMock, res.locals.stripeAccount.stripeAccountId, {
      vat_id: sanitisedVatNumber,
      tax_id: sanitisedCompanyNumber
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'vat_number_company_number', req.correlationId)
    sinon.assert.calledWith(res.redirect, 303, paths.dashboard.index)
  })

  it('should call stripe and connector with all data and redirect to the add account details redirect route', async () => {
    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res)

    sinon.assert.calledWith(updateCompanyMock, res.locals.stripeAccount.stripeAccountId, {
      vat_id: sanitisedVatNumber,
      tax_id: sanitisedCompanyNumber
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'vat_number_company_number', req.correlationId)
    sinon.assert.calledWith(res.redirect, 303, paths.stripe.addPspAccountDetails)
  })

  it('should call stripe and connector with VAT number only and redirect to the add account details redirect route', async () => {
    req.session.pageData.stripeSetup.companyNumberData = {
      errors: {},
      companyNumberDeclaration: '',
      companyNumber: ''
    }
    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res)

    sinon.assert.calledWith(updateCompanyMock, res.locals.stripeAccount.stripeAccountId, {
      vat_id: sanitisedVatNumber
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'vat_number_company_number', req.correlationId)
    sinon.assert.calledWith(res.redirect, 303, paths.stripe.addPspAccountDetails)
  })

  it('should render error page when Stripe returns an error', async () => {
    updateCompanyMock = sinon.spy(() => Promise.reject(new Error()))
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res)

    sinon.assert.calledWith(updateCompanyMock, res.locals.stripeAccount.stripeAccountId, {
      vat_id: sanitisedVatNumber,
      tax_id: sanitisedCompanyNumber
    })
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.notCalled(res.redirect)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error', { message: 'Please try again or contact support team' })
  })

  it('should render error page when connector returns error', async () => {
    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.reject(new Error()))
    const controller = getControllerWithMocks()

    await controller(req, res)

    sinon.assert.calledWith(updateCompanyMock, res.locals.stripeAccount.stripeAccountId, {
      vat_id: sanitisedVatNumber,
      tax_id: sanitisedCompanyNumber
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'vat_number_company_number', req.correlationId)
    sinon.assert.notCalled(res.redirect)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error', { message: 'Please try again or contact support team' })
  })

  function getControllerWithMocks () {
    return proxyquire('./post.controller', {
      '../../../../services/clients/stripe/stripe_client': {
        updateCompany: updateCompanyMock
      },
      '../../../../services/clients/connector_client': {
        ConnectorClient: function () {
          this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
        }
      }
    })
  }
})
