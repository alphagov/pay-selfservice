const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const Service = require('@models/Service.class')
const GatewayAccount = require('@models/GatewayAccount.class')
const sinon = require('sinon')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const Worldpay3dsFlexCredential = require('@models/gateway-account-credential/Worldpay3dsFlexCredential.class')
const { validServiceResponse } = require('@test/fixtures/service.fixtures')

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const mockResponse = sinon.spy()

const worldpayDetailsServiceStubs = {
  check3dsFlexCredential: sinon.stub().returns(true),
  update3dsFlexCredentials: sinon.spy(),
  updateIntegrationVersion3ds: sinon.spy()
}

const validFlexCredential = new Worldpay3dsFlexCredential()
  .withOrganisationalUnitId('5bd9b55e4444761ac0af1c80') // pragma: allowlist secret
  .withIssuer('5bd9e0e4444dce15fed8c940') // pragma: allowlist secret
  .withJwtMacKey('fa2daee2-1fbb-45ff-4444-52805d5cd9e0') // pragma: allowlist secret

const { req, res, nextRequest, nextStubs, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/worldpay-details/flex-credentials/worldpay-flex-credentials.controller')
  .withService(new Service(validServiceResponse({
    external_id: SERVICE_EXTERNAL_ID
  })))
  .withAccount(new GatewayAccount({
    type: ACCOUNT_TYPE,
    allow_moto: false,
    gateway_account_id: 1,
    gateway_account_credentials: [{
      external_id: 'creds-id',
      payment_provider: 'worldpay',
      state: 'CREATED',
      created_date: '2024-11-29T11:58:36.214Z',
      gateway_account_id: 1,
      credentials: { one_off_customer_initiated: {} }
    }]
  }))
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/worldpay-details.service': worldpayDetailsServiceStubs
  })
  .build()

describe('Controller: settings/worldpay-details/flex-credentials', () => {
  describe('get', () => {
    describe('when no credentials have yet been set', () => {
      beforeEach(() => {
        call('get')
      })

      it('should call the response method', () => {
        expect(mockResponse.called).to.be.true
      })

      it('should pass req, res and template path to the response method', () => {
        mockResponse.should.have.been.calledWith(req, res, 'simplified-account/settings/worldpay-details/flex-credentials')
      })

      it('should pass context data with no credentials to the response method', () => {
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          credentials: {
            organisationalUnitId: undefined,
            issuer: undefined
          },
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        })
      })
    })

    describe('when credentials have already been set', () => {
      beforeEach(() => {
        nextRequest({
          account: {
            worldpay3dsFlex: {
              organisationalUnitId: '5bd9b55e4444761ac0af1c80', // pragma: allowlist secret
              issuer: '5bd9e0e4444dce15fed8c940' // pragma: allowlist secret
            }
          }
        })
        call('get')
      })

      it('should pass context data with credentials to the response method', () => {
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          credentials: {
            organisationalUnitId: '5bd9b55e4444761ac0af1c80', // pragma: allowlist secret
            issuer: '5bd9e0e4444dce15fed8c940' // pragma: allowlist secret
          },
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        })
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
              backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
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
              backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
            })
        })
      })

      describe('when submitting valid data', () => {
        beforeEach(() => {
          nextRequest({
            body: {
              organisationalUnitId: '5bd9b55e4444761ac0af1c80', // pragma: allowlist secret
              issuer: '5bd9e0e4444dce15fed8c940', // pragma: allowlist secret
              jwtMacKey: 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0' // pragma: allowlist secret
            }
          })
        })
        describe('when the worldpay credential check fails', () => {
          beforeEach(() => {
            nextStubs({
              '@services/worldpay-details.service': {
                check3dsFlexCredential: sinon.stub().returns(false),
                update3dsFlexCredentials: sinon.spy(),
                updateIntegrationVersion3ds: sinon.spy()
              }
            })
          })

          it('should render the form with an error', async () => {
            await call('post')

            mockResponse.should.have.been.calledOnce
            mockResponse.should.have.been.calledWith(
              sinon.match.any,
              sinon.match.any,
              'simplified-account/settings/worldpay-details/flex-credentials',
              {
                errors: {
                  summary: [
                    { text: 'Check your 3DS credentials, failed to link your account to Worldpay with credentials provided', href: '#organisational-unit-id' }
                  ]
                },
                credentials: {
                  organisationalUnitId: '5bd9b55e4444761ac0af1c80', // pragma: allowlist secret
                  issuer: '5bd9e0e4444dce15fed8c940', // pragma: allowlist secret
                  jwtMacKey: 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0' // pragma: allowlist secret
                },
                backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
              })
          })
        })

        describe('when the worldpay credential check passes', () => {
          beforeEach(() => {
            nextStubs({
              '@services/worldpay-details.service': worldpayDetailsServiceStubs
            })
          })

          it('should call the worldpay details service to update the 3ds flex credentials', async () => {
            await call('post')

            worldpayDetailsServiceStubs.update3dsFlexCredentials.should.have.been.calledOnce
            worldpayDetailsServiceStubs.update3dsFlexCredentials.should.have.been.calledWith(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, validFlexCredential)
          })
        })

        it('should call the worldpay details service to update the 3ds integration version', async () => {
          await call('post')

          worldpayDetailsServiceStubs.updateIntegrationVersion3ds.should.have.been.calledOnce
          worldpayDetailsServiceStubs.updateIntegrationVersion3ds.should.have.been.calledWith(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        })

        it('should call the redirect method with the worldpay details index path on success', async () => {
          await call('post')

          res.redirect.should.have.been.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE))
        })
      })
    })
  })
})
