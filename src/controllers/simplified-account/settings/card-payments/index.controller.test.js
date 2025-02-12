const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const sinon = require('sinon')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const GATEWAY_ACCOUNT_ID = '123'
const BASE_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/card-payments/`

const mockResponse = sinon.spy()

const adminUser = new User(userFixtures.validUserResponse({
  external_id: 'user-id-for-admin-user',
  service_roles: {
    service: {
      service: { external_id: SERVICE_EXTERNAL_ID },
      role: { name: 'admin' }
    }
  }
}))

const viewOnlyUser = new User(userFixtures.validUserResponse(
  {
    external_id: 'user-id-for-view-only-user',
    service_roles: {
      service:
        {
          service: { external_id: SERVICE_EXTERNAL_ID },
          role: {
            name: 'view-only',
            permissions: [{ name: 'no-valid-permission' }]
          }
        }
    }
  }))

const { res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/card-payments/index.controller')
  .withStubs({
    '@utils/response': { response: mockResponse }
  })
  .build()

describe('Controller: settings/card-payments', () => {
  describe('get for admin user', () => {
    before(() => {
      nextRequest({
        user: adminUser,
        service: {
          externalId: SERVICE_EXTERNAL_ID,
          collectBillingAddress: false,
          defaultBillingAddressCountry: 'GB'
        },
        account: {
          type: ACCOUNT_TYPE,
          id: GATEWAY_ACCOUNT_ID,
          allowApplePay: false,
          allowGooglePay: false
        }
      })
      call('get')
    })
    it('should call the response method', () => {
      expect(mockResponse).to.have.been.calledOnce  // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0].user).to.deep.equal(adminUser)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/card-payments/index')
    })

    it('should pass context data to the response method', () => {
      const context = mockResponse.args[0][3]
      expect(context).to.have.property('collectBillingAddressEnabled').to.equal(false)
      expect(context).to.have.property('collectBillingAddressLink').to.equal(BASE_URL + 'collect-billing-address')
      expect(context).to.have.property('defaultBillingAddressCountry').to.equal('United Kingdom')
      expect(context).to.have.property('defaultBillingAddressCountryLink').to.equal(BASE_URL + 'default-billing-address-country')
      expect(context).to.have.property('applePayEnabled').to.equal(false)
      expect(context).to.have.property('applePayLink').to.equal(BASE_URL + 'apple-pay')
      expect(context).to.have.property('googlePayEnabled').to.equal(false)
      expect(context).to.have.property('googlePayLink').to.equal(BASE_URL + 'google-pay')
      expect(context).to.have.property('userCanUpdatePaymentTypes').to.equal(true)
    })
  })
  describe('get for non-admin user', () => {
    before(() => {
      nextRequest({
        user: viewOnlyUser,
        service: {
          externalId: SERVICE_EXTERNAL_ID,
          collectBillingAddress: true
        },
        account: {
          type: ACCOUNT_TYPE,
          id: GATEWAY_ACCOUNT_ID,
          allowApplePay: true,
          allowGooglePay: true
        }
      })
      call('get')
    })
    it('should call the response method', () => {
      expect(mockResponse).to.have.been.calledOnce  // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0].user).to.deep.equal(viewOnlyUser)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/card-payments/index')
    })

    it('should pass context data to the response method', () => {
      const context = mockResponse.args[0][3]
      expect(context).to.have.property('collectBillingAddressEnabled').to.equal(true)
      expect(context).to.have.property('defaultBillingAddressCountry').to.equal('None')
      expect(context).to.have.property('applePayEnabled').to.equal(true)
      expect(context).to.have.property('googlePayEnabled').to.equal(true)
      expect(context).to.have.property('userCanUpdatePaymentTypes').to.equal(false)
    })
  })
})
