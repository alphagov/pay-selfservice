'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { expect } = require('chai')
const Service = require('../../../models/Service.class')
const User = require('../../../models/User.class')
const serviceFixtures = require('../../../../test/fixtures/service.fixtures')
const userFixtures = require('../../../../test/fixtures/user.fixtures')
const gatewayAccountFixture = require('../../../../test/fixtures/gateway-account.fixtures')

const stripeAcountId = 'acct_123example123'
const stubGetStripeAccountId = sinon.stub().resolves(stripeAcountId)

describe('Check org details - post controller', () => {
  let req
  let res
  let next

  const setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
  const loggerInfoMock = sinon.spy(() => Promise.resolve())
  const stripeAcountId = 'acct_123example123'

  function getControllerWithMocks () {
    return proxyquire('./post.controller', {
      '../../../services/clients/connector.client': {
        ConnectorClient: function () {
          this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
        }
      },
      '../stripe-setup.util': {
        getStripeAccountId: (...params) => {
          return stubGetStripeAccountId(...params)
        }
      },
      '../../../utils/logger': function (filename) {
        return {
          info: loggerInfoMock
        }
      }
    })
  }

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

  const credentialId = 'a-valid-credential-id'

  const controller = getControllerWithMocks()

  beforeEach(() => {
    req = {
      params: { credentialId },
      account: gatewayAccountFixture.validGatewayAccount({
        gateway_account_credentials: [{
          external_id: credentialId
        }]
      }),
      service: service,
      user: user,
      flash: sinon.spy()
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }

    next = sinon.spy()

    setStripeAccountSetupFlagMock.resetHistory()
    loggerInfoMock.resetHistory()
    stubGetStripeAccountId.resetHistory()
  })

  it('should render error page when stripe setup is not available on request', () => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    controller(req, res, next)

    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Stripe setup progress is not available on request'))
    sinon.assert.calledWith(next, expectedError)
  })

  it('when organisation details are already provided, should display an error', () => {
    req.account.connectorGatewayAccountStripeProgress = { organisationDetails: true }

    controller(req, res, next)

    sinon.assert.calledWith(res.render, 'error-with-link')
  })

  it('when no radio button is selected, then it should display the page with an error and the org name and address', () => {
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

  describe('radio buttons', () => {
    describe('Stripe onboarding', () => {
      afterEach(() => {
        process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'false'
      })
      it('when `no` radio button is selected, then it should redirect to `Stripe onboarding > org address` page', () => {
        req.account.connectorGatewayAccountStripeProgress = { organisationDetails: false }

        req.body = {
          'confirm-org-details': 'no'
        }

        controller(req, res, next)

        sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/your-psp/a-valid-credential-id/update-organisation-details')
      })

      it('when `yes` radio button is selected, then it should redirect to the `Stripe onboarding > add psp account details` redirect route', async () => {
        req.account.connectorGatewayAccountStripeProgress = { organisationDetails: false }

        req.body = {
          'confirm-org-details': 'yes'
        }

        await controller(req, res, next)

        const isSwitchingCredentials = false
        sinon.assert.calledWith(stubGetStripeAccountId, req.account, isSwitchingCredentials)

        sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'organisation_details')
        sinon.assert.calledWith(loggerInfoMock, 'Organisation details confirmed for Stripe account', { stripe_account_id: stripeAcountId })
        sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/stripe/add-psp-account-details')
      })

      it('when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true and `no` radio button is selected, then it should redirect to `Stripe onboarding > org address` page', () => {
        process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'false'

        req.account.connectorGatewayAccountStripeProgress = { organisationDetails: false }

        req.body = {
          'confirm-org-details': 'no'
        }

        controller(req, res, next)

        sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/your-psp/a-valid-credential-id/update-organisation-details')
      })
      it('when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true and `yes` radio button is selected, then it should redirect to tasklist page', async () => {
        process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

        req.account.connectorGatewayAccountStripeProgress = { organisationDetails: false }

        req.body = {
          'confirm-org-details': 'yes'
        }

        await controller(req, res, next)

        sinon.assert.calledWith(stubGetStripeAccountId, req.account)

        sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'organisation_details')
        sinon.assert.calledWith(loggerInfoMock, 'Organisation details confirmed for Stripe account', { stripe_account_id: stripeAcountId })
        sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id/your-psp/a-valid-credential-id`)
      })
    })

    describe('Switch PSP to Stripe', () => {
      it('when `no` radio button is selected, then it should redirect to `switch psp to Stripe > update org address` page', () => {
        req.url = '/switch-psp/test-credential/check-organisation-details'
        req.account.connectorGatewayAccountStripeProgress = { organisationDetails: false }

        req.body = {
          'confirm-org-details': 'no'
        }

        controller(req, res, next)

        sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/switch-psp/a-valid-credential-id/update-organisation-details')
      })

      it('when `yes` radio button is selected, then it should redirect to the `switch psp to Stripe > switch PSP index` redirect route', async () => {
        req.url = '/switch-psp/test-credential/check-organisation-details'
        req.account.connectorGatewayAccountStripeProgress = { organisationDetails: false }

        req.body = {
          'confirm-org-details': 'yes'
        }

        await controller(req, res, next)

        const isSwitchingCredentials = true
        sinon.assert.calledWith(stubGetStripeAccountId, req.account, isSwitchingCredentials)

        sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'organisation_details')
        sinon.assert.calledWith(loggerInfoMock, 'Organisation details confirmed for Stripe account', { stripe_account_id: stripeAcountId })
        sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/switch-psp')
      })
    })
  })
})
