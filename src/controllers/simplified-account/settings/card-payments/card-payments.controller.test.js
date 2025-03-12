const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const sinon = require('sinon')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

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

const {
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/card-payments/card-payments.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    id: GATEWAY_ACCOUNT_ID
  })
  .withStubs({
    '@utils/response': { response: mockResponse }
  })
  .build()

describe('Controller: settings/card-payments', () => {
  describe('get', () => {
    describe('for admin user', () => {
      describe('for non-moto gateway account', () => {
        before(() => {
          nextRequest({
            user: adminUser,
            service: {
              collectBillingAddress: false,
              defaultBillingAddressCountry: 'GB'
            },
            account: {
              allowApplePay: false,
              allowGooglePay: false,
              getActiveCredential: () => true
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
          expect(context).to.have.property('googlePayEditable').to.equal(true)
          expect(context).to.have.property('userCanUpdatePaymentTypes').to.equal(true)
          expect(context).to.not.have.property('isMoto')
          expect(context).to.not.have.property('hideCardSecurityCodeEnabled')
        })
      })
      describe('for moto gateway account', () => {
        before(() => {
          nextRequest({
            user: adminUser,
            account: {
              allowMoto: true,
              motoMaskCardNumber: false,
              motoMaskCardSecurityCode: true,
              getActiveCredential: () => null
            }
          })
          call('get')
        })

        it('should pass additional context data to the response method', () => {
          const context = mockResponse.args[0][3]
          expect(context).to.have.property('googlePayEditable').to.equal(false)
          expect(context).to.have.property('isMoto').to.equal(true)
          expect(context).to.have.property('hideCardNumberEnabled').to.equal(false)
          expect(context).to.have.property('hideCardNumberLink').to.equal(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.motoSecurity.hideCardNumber, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE))
          expect(context).to.have.property('hideCardSecurityCodeEnabled').to.equal(true)
          expect(context).to.have.property('hideCardSecurityCodeLink').to.equal(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.motoSecurity.hideCardSecurityCode, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE))
        })
      })
    })
    describe('for non-admin user', () => {
      describe('for non-moto gateway account', () => {
        before(() => {
          nextRequest({
            user: viewOnlyUser,
            service: {
              collectBillingAddress: true
            },
            account: {
              allowApplePay: true,
              allowGooglePay: true,
              getActiveCredential: () => true
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
      describe('for moto gateway account', () => {
        before(() => {
          nextRequest({
            user: viewOnlyUser,
            account: {
              allowMoto: true,
              motoMaskCardNumber: false,
              motoMaskCardSecurityCode: true,
              getActiveCredential: () => null
            }
          })
          call('get')
        })

        it('should pass additional context data to the response method', () => {
          const context = mockResponse.args[0][3]
          expect(context).to.have.property('userCanUpdatePaymentTypes').to.equal(false)
          expect(context).to.have.property('isMoto').to.equal(true)
          expect(context).to.have.property('hideCardNumberEnabled').to.equal(false)
          expect(context).to.have.property('hideCardNumberLink').to.equal(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.motoSecurity.hideCardNumber, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE))
          expect(context).to.have.property('hideCardSecurityCodeEnabled').to.equal(true)
          expect(context).to.have.property('hideCardSecurityCodeLink').to.equal(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.motoSecurity.hideCardSecurityCode, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE))
        })
      })
    })
  })
})
