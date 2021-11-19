'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const gatewayAccountFixtures = require('../../../../test/fixtures/gateway-account.fixtures')

describe('Responsible person add additional details POST controller', () => {
  const telephone = '01134960000 '
  const telephoneNormalised = '+44 113 496 0000'
  const email = ' foo@example.com'
  const emailNormalised = 'foo@example.com'

  const credentialId = 'a-credential-id'
  const accountExternalId = 'a-valid-external-id'
  const account = gatewayAccountFixtures.validGatewayAccountResponse({
    gateway_account_id: '1',
    external_id: accountExternalId,
    gateway_account_credentials: [{
      external_id: credentialId
    }]
  })

  let req
  let next
  let res
  let listPersonsMock
  let updatePersonAddAdditionalKYCDetailsMock

  function getControllerWithMocks () {
    return proxyquire('./post-additional-details.controller', {
      '../../../services/clients/stripe/stripe.client': {
        listPersons: listPersonsMock,
        updatePersonAddAdditionalKYCDetails: updatePersonAddAdditionalKYCDetailsMock
      },
      '../stripe-setup.util': {
        getStripeAccountId: () => {
          return Promise.resolve('acct_123example123')
        }
      }
    })
  }

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account,
      body: {},
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

  it('should call Stripe to add additional KYC details to person', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        {
          id: personId,
          relationship: {
            representative: true
          }
        }
      ]
    }))
    updatePersonAddAdditionalKYCDetailsMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.route = {
      path: `/kyc/:credentialId/responsible-person`
    }
    req.body = {
      'adding-additional-details': 'true',
      email,
      'telephone-number': telephone
    }

    await controller(req, res, next)

    sinon.assert.calledWith(updatePersonAddAdditionalKYCDetailsMock, res.locals.stripeAccount.stripeAccountId, personId, {
      phone: telephoneNormalised,
      email: emailNormalised
    })
    sinon.assert.calledWith(res.redirect, 303, `/account/${accountExternalId}/your-psp/${credentialId}`)
  })
})
