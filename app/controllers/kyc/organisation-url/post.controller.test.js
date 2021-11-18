'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../paths')
const { validPaths, ServiceUpdateRequest } = require('../../../models/ServiceUpdateRequest.class')

describe('Organisation URL POST controller', () => {
  const organisationUrl = 'https://www.example.com'

  const postBody = {
    'organisation-url': organisationUrl
  }

  let req
  let next
  let res
  let updateAccountMock
  let updateServiceMock

  function getControllerWithMocks () {
    return proxyquire('./post.controller', {
      '../../../services/clients/stripe/stripe.client': {
        updateAccount: updateAccountMock
      },
      '../../stripe-setup/stripe-setup.util': {
        getStripeAccountId: () => {
          return Promise.resolve('acct_123example123')
        }
      },
      '../../../services/service.service': {
        updateService: updateServiceMock
      }
    })
  }

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1',
        external_id: 'a-valid-external-id',
        connectorGatewayAccountStripeProgress: {},
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 100, external_id: 'a-valid-credential-id-stripe' }
        ]
      },
      service: {
        externalId: '1'
      },
      flash: sinon.spy(),
      route: {
        path: paths.account.kyc.organisationUrl
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
    next = sinon.spy()
    updateAccountMock = sinon.spy(() => Promise.resolve())
    updateServiceMock = sinon.spy(() => Promise.resolve())
  })

  it('update Stripe company URL, update admin users client and then redirect to Your PSP page', async () => {
    req.body = postBody
    req.account.requires_additional_kyc_data = true
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateAccountMock, res.locals.stripeAccount.stripeAccountId, { url: organisationUrl })

    const updateRequest = new ServiceUpdateRequest()
      .replace(validPaths.merchantDetails.url, organisationUrl)
    sinon.assert.calledWith(updateServiceMock, req.service.externalId, updateRequest.formatPayload(), req.correlationId)
    sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/your-psp/a-valid-credential-id-stripe')
  })

  it('should render error when Stripe returns error, not call admin users, and not redirect', async function () {
    updateAccountMock = sinon.spy(() => Promise.reject(new Error()))
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(updateAccountMock)
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })
})
