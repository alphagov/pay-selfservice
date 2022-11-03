'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const assert = require('assert')
const gatewayAccountFixtures = require('../../../../test/fixtures/gateway-account.fixtures')
const userFixtures = require('../../../../test/fixtures/user.fixtures')
const User = require('../../../models/User.class')

describe('Responsible person add additional details POST controller', () => {
  const telephone = '01134960000 '
  const telephoneNormalised = '+44 113 496 0000'
  const email = ' foo@example.com'
  const emailNormalised = 'foo@example.com'
  const personId = 'person-1'
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
  let listPersonsMock
  let updatePersonAddAdditionalKYCDetailsMock
  let completeKycMock
  let getExistingResponsiblePersonNameMock

  function getControllerWithMocks (isKycTaskListComplete = false) {
    return proxyquire('./post-additional-details.controller', {
      '../../../services/clients/stripe/stripe.client': {
        listPersons: listPersonsMock,
        updatePersonAddAdditionalKYCDetails: updatePersonAddAdditionalKYCDetailsMock
      },
      '../stripe-setup.util': {
        getStripeAccountId: () => {
          return Promise.resolve(stripeAccountId)
        },
        completeKyc: completeKycMock,
        getExistingResponsiblePersonName: getExistingResponsiblePersonNameMock
      },
      '../../../controllers/your-psp/kyc-tasks.service': {
        isKycTaskListComplete: () => isKycTaskListComplete
      }
    })
  }

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account,
      user,
      service,
      body: {
        'adding-additional-details': 'true',
        email,
        'telephone-number': telephone
      },
      route: {
        path: `/kyc/:credentialId/responsible-person`
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
    completeKycMock = sinon.spy(() => Promise.resolve())
    updatePersonAddAdditionalKYCDetailsMock = sinon.spy(() => Promise.resolve())
    getExistingResponsiblePersonNameMock = sinon.spy(() => Promise.resolve())
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
  })

  it('should call Stripe to add additional KYC details to person', async function () {
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updatePersonAddAdditionalKYCDetailsMock, res.locals.stripeAccount.stripeAccountId, personId, {
      phone: telephoneNormalised,
      email: emailNormalised
    })
    sinon.assert.calledWith(res.redirect, 303, `/account/${accountExternalId}/your-psp/${credentialId}`)
    sinon.assert.calledWith(req.flash, 'generic', 'Responsible person details added successfully')
    sinon.assert.notCalled(completeKycMock)
  })

  it('should display an error message for phone number, if Stripe returns error for phone number', async function () {
    const errorFromStripe = {
      type: 'StripeInvalidRequestError',
      param: 'phone'
    }
    updatePersonAddAdditionalKYCDetailsMock = sinon.spy(() => Promise.reject(errorFromStripe))
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updatePersonAddAdditionalKYCDetailsMock, res.locals.stripeAccount.stripeAccountId, personId, {
      phone: telephoneNormalised,
      email: emailNormalised
    })
    sinon.assert.notCalled(completeKycMock)

    sinon.assert.calledWith(res.render, `stripe-setup/responsible-person/kyc-additional-information`)
    assert.strictEqual(res.render.getCalls()[0].args[1].errors['telephone-number'],
      'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
  })

  it('should call completeKyc if all KYC tasks are complete for additional KYC details collection', async function () {
    const controller = getControllerWithMocks(true)

    await controller(req, res, next)

    sinon.assert.calledWith(updatePersonAddAdditionalKYCDetailsMock, res.locals.stripeAccount.stripeAccountId, personId, {
      phone: telephoneNormalised,
      email: emailNormalised
    })
    sinon.assert.calledWith(res.redirect, 303, `/account/${accountExternalId}/your-psp/${credentialId}`)
    sinon.assert.calledWith(completeKycMock, account.gateway_account_id, service, stripeAccountId)
    sinon.assert.calledWith(req.flash, 'generic', 'You’ve successfully added all the Know your customer details for this service.')
  })
})
