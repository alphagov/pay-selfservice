'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../paths')
const { validPaths, ServiceUpdateRequest } = require('../../../models/ServiceUpdateRequest.class')
const gatewayAccountFixtures = require('../../../../test/fixtures/gateway-account.fixtures')
const userFixtures = require('../../../../test/fixtures/user.fixtures')
const User = require('../../../models/User.class')

describe('Organisation URL POST controller', () => {
  const organisationUrl = 'https://www.example.com'

  const postBody = {
    'organisation-url': organisationUrl
  }

  const stripeAccountId = 'acct_123example123'
  const credentialId = 'a-credential-id'
  const accountExternalId = 'a-valid-external-id'
  const account = gatewayAccountFixtures.validGatewayAccountResponse({
    gateway_account_id: '1',
    external_id: accountExternalId,
    gateway_account_credentials: [{
      external_id: credentialId
    }]
  })
  const user = new User(userFixtures.validUserResponse())
  const service = user.serviceRoles[0].service

  let req
  let next
  let res
  let updateAccountMock
  let updateServiceMock
  let completeKycMock

  function getControllerWithMocks (isKycTaskListComplete = false) {
    return proxyquire('./post.controller', {
      '../../../services/clients/stripe/stripe.client': {
        updateAccount: updateAccountMock
      },
      '../../stripe-setup/stripe-setup.util': {
        getStripeAccountId: () => {
          return Promise.resolve(stripeAccountId)
        },
        completeKyc: completeKycMock
      },
      '../../../services/service.service': {
        updateService: updateServiceMock
      },
      '../../../controllers/your-psp/kyc-tasks.service': {
        isKycTaskListComplete: () => isKycTaskListComplete
      }
    })
  }

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        ...account,
        connectorGatewayAccountStripeProgress: {}
      },
      user,
      service,
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
          stripeAccountId
        }
      }
    }
    next = sinon.spy()
    updateAccountMock = sinon.spy(() => Promise.resolve())
    updateServiceMock = sinon.spy(() => Promise.resolve())
    completeKycMock = sinon.spy(() => Promise.resolve())
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
    sinon.assert.calledWith(res.redirect, 303, `/account/${accountExternalId}/your-psp/${credentialId}`)
    sinon.assert.calledWith(req.flash, 'generic', 'Organisation website address added successfully')
    sinon.assert.notCalled(completeKycMock)
  })

  it('should call completeKyc if all KYC tasks are complete for additional KYC details collection', async () => {
    req.body = postBody
    req.account.requires_additional_kyc_data = true
    const controller = getControllerWithMocks(true)

    await controller(req, res, next)

    sinon.assert.calledWith(updateAccountMock, res.locals.stripeAccount.stripeAccountId, { url: organisationUrl })

    const updateRequest = new ServiceUpdateRequest()
      .replace(validPaths.merchantDetails.url, organisationUrl)
    sinon.assert.calledWith(updateServiceMock, req.service.externalId, updateRequest.formatPayload(), req.correlationId)
    sinon.assert.calledWith(res.redirect, 303, `/account/${accountExternalId}/your-psp/${credentialId}`)
    sinon.assert.calledWith(completeKycMock, account.gateway_account_id, service, stripeAccountId, req.correlationId)
    sinon.assert.calledWith(req.flash, 'generic', 'You’ve successfully added all the Know your customer details for this service.')
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
