const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const Service = require('@models/Service.class')
const GatewayAccount = require('@models/GatewayAccount.class')
const sinon = require('sinon')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'

const mockResponse = sinon.spy()

const { req, res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/worldpay-details/flex-credentials/worldpay-flex-credentials.controller')
  .withService(new Service({
    external_id: SERVICE_ID
  }))
  .withAccount(new GatewayAccount({
    type: ACCOUNT_TYPE,
    allow_moto: true,
    gateway_account_id: 1,
    gateway_account_credentials: [{
      external_id: 'creds-id',
      payment_provider: 'worldpay',
      state: 'CREATED',
      created_date: '2024-11-29T11:58:36.214Z',
      gateway_account_id: 1,
      credentials: {}
    }]
  }))
  .withStubs({
    '@utils/response': { response: mockResponse }
  })
  .build()

describe('Controller: settings/worldpay-details/flex-credentials', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      mockResponse.should.have.been.calledWith(req, res, 'simplified-account/settings/worldpay-details/flex-credentials')
    })

    it('should pass context data to the response method', () => {
      mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
        backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_ID, ACCOUNT_TYPE)
      })
    })
  })

  describe('post', () => {
    describe('for MOTO gateway accounts', () => {
      describe('when submitting invalid data', () => {
        it('should render the form with validation errors when input fields are missing', async () => {
          nextRequest({
            body: {
              organisationalUnitId: '',
              issuer: '',
              jwtMacKey: ''
            }
          })
          await call('post')

          mockResponse.should.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            'simplified-account/settings/worldpay-details/flex-credentials',
            {
              errors: {
                summary: [
                  { text: 'Enter your JWT MAC key', href: '#jwt-mac-key' },
                  { text: 'Enter your organisational unit ID', href: '#organisational-unit-id' },
                  { text: 'Enter your issuer', href: '#issuer' }
                ],
                formErrors: {
                  jwtMacKey: 'Enter your JWT MAC key',
                  organisationalUnitId: 'Enter your organisational unit ID',
                  issuer: 'Enter your issuer'
                }
              },
              credentials: {
                organisationalUnitId: '',
                issuer: '',
                jwtMacKey: ''
              },
              backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_ID, ACCOUNT_TYPE)
            })
        })

        it('should render the form with validation errors when inputs are not in the correct format', async () => {
          nextRequest({
            body: {
              organisationalUnitId: 'not-a-hex-string',
              issuer: '1234567890abcdef', // pragma: allowlist secret
              jwtMacKey: 'not-a-uuid'
            }
          })
          await call('post')

          mockResponse.should.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            'simplified-account/settings/worldpay-details/flex-credentials',
            {
              errors: {
                summary: [
                  { text: 'Enter your JWT MAC key in the format you received it', href: '#jwt-mac-key' },
                  { text: 'Enter your organisational unit ID in the format you received it', href: '#organisational-unit-id' },
                  { text: 'Enter your issuer in the format you received it', href: '#issuer' }
                ],
                formErrors: {
                  jwtMacKey: 'Enter your JWT MAC key in the format you received it',
                  organisationalUnitId: 'Enter your organisational unit ID in the format you received it',
                  issuer: 'Enter your issuer in the format you received it'
                }
              },
              credentials: {
                organisationalUnitId: 'not-a-hex-string',
                issuer: '1234567890abcdef', // pragma: allowlist secret
                jwtMacKey: 'not-a-uuid'
              },
              backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_ID, ACCOUNT_TYPE)
            })
        })
      })

      describe('when submitting valid data', () => {
        it('should call the redirect method with the worldpay details index path on success', async () => {
          nextRequest({
            body: {
              organisationalUnitId: '5bd9b55e4444761ac0af1c80', // pragma: allowlist secret
              issuer: '5bd9e0e4444dce15fed8c940', // pragma: allowlist secret
              jwtMacKey: 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0' // pragma: allowlist secret
            }
          })
          await call('post')

          res.redirect.should.have.been.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_ID, ACCOUNT_TYPE))
        })
      })
    })
  })
})
