const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { STRIPE } = require('@models/constants/payment-providers')
const sinon = require('sinon')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { paths } = require('@root/routes')
const Worldpay3dsFlexCredential = require('@models/gateway-account-credential/Worldpay3dsFlexCredential.class')

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const USER_EXTERNAL_ID = 'user-id-123abc'

const mockResponse = sinon.spy()

const mockWorldpayDetailsService = {
  check3dsFlexCredential: sinon.stub().resolves(true),
  update3dsFlexCredentials: sinon.stub().resolves(),
  updateIntegrationVersion3ds: sinon.stub().resolves()
}

const {
  req,
  res,
  nextRequest,
  nextStubs,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/switch-psp/switch-to-worldpay/add-flex-credentials.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    providerSwitchEnabled: true,
    paymentProvider: STRIPE,
    allowMoto: true
    // getSwitchingCredential: getSwitchingCredentialStub
  })
  .withUser({
    externalId: USER_EXTERNAL_ID
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/worldpay-details.service': mockWorldpayDetailsService
  })
  .build()

describe('Controller: settings/switch-psp/switch-to-worldpay/add-flex-credentials', () => {
  describe('get', () => {
    describe('when credentials are undefined', () => {
      before(() => {
        call('get')
      })
      it('should call the response method', () => {
        sinon.assert.calledOnce(mockResponse)
      })
      it('should pass req, res and template path to the response method', () => {
        sinon.assert.calledWith(mockResponse,
          req,
          res,
          'simplified-account/settings/switch-psp/switch-to-worldpay/add-3ds-flex-credentials'
        )
      })
      it('should pass the context data to the response method', () => {
        const context = mockResponse.args[0][3]
        sinon.assert.match(context, {
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        })
      })
    })
    describe('when credentials are defined', () => {
      before(() => {
        nextRequest({
          account: {
            worldpay3dsFlex: {
              organisationalUnitId: 'an-org-unit-id',
              issuer: 'an-issuer'
            }
          }
        })
        call('get')
      })
      it('should pass the context data to the response method', () => {
        const context = mockResponse.args[0][3]
        sinon.assert.match(context, {
          credentials: {
            organisationalUnitId: 'an-org-unit-id',
            issuer: 'an-issuer'
          },
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        })
      })
    })
  })

  describe('post', () => {
    describe('when credentials are valid', () => {
      const expectedCredential = new Worldpay3dsFlexCredential()
        .withOrganisationalUnitId('5bd9b55e4444761ac0af1c80') // pragma: allowlist secret
        .withIssuer('5bd9e0e4444dce153428c940') // pragma: allowlist secret
        .withJwtMacKey('fa2daee2-1fbb-45ff-4444-52805d5cd9e0')

      before(() => {
        nextRequest({
          body: {
            organisationalUnitId: expectedCredential.organisationalUnitId,
            issuer: expectedCredential.issuer,
            jwtMacKey: expectedCredential.jwtMacKey
          }
        })
        call('post')
      })
      it('should check inputted credentials', () => {
        sinon.assert.calledOnceWithExactly(mockWorldpayDetailsService.check3dsFlexCredential,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE,
          expectedCredential
        )
      })
      it('should update 3ds flex credentials', () => {
        sinon.assert.calledOnceWithExactly(mockWorldpayDetailsService.update3dsFlexCredentials,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE,
          expectedCredential
        )
      })
      it('should update integration version 3ds', () => {
        sinon.assert.calledOnceWithExactly(mockWorldpayDetailsService.updateIntegrationVersion3ds,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
        )
      })
      it('should redirect to switch to worldpay tasks index', () => {
        sinon.assert.calledOnceWithExactly(res.redirect,
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        )
      })
    })
    describe('when credentials are invalid', () => {
      describe('due to them being missing or invalid format', () => {
        before(async () => {
          nextRequest({
            body: {
              organisationalUnitId: 'not-a-hexadecimal'
            }
          })
          await call('post')
        })
        it('should render response with validation error', () => {
          mockResponse.should.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            'simplified-account/settings/switch-psp/switch-to-worldpay/add-3ds-flex-credentials',
            {
              errors: {
                summary: [
                  { text: 'Enter your JWT MAC key', href: '#jwt-mac-key' },
                  { text: 'Enter your issuer', href: '#issuer' },
                  { text: 'Enter your organisational unit ID in the format you received it', href: '#organisational-unit-id' }
                ],
                formErrors: {
                  jwtMacKey: 'Enter your JWT MAC key',
                  issuer: 'Enter your issuer',
                  organisationalUnitId: 'Enter your organisational unit ID in the format you received it'
                }
              },
              credentials: {
                organisationalUnitId: 'not-a-hexadecimal',
                issuer: undefined,
                jwtMacKey: undefined
              },
              backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
            }
          )
        })
      })
      describe('due to the credential check returning false', () => {
        before(async () => {
          nextStubs({
            '@services/worldpay-details.service': {
              check3dsFlexCredential: sinon.stub().resolves(false)
            }
          })
          nextRequest({
            body: {
              organisationalUnitId: '5bd9b55e4444761ac0af1c80', // pragma: allowlist secret
              issuer: '5bd9e0e4444dce153428c940', // pragma: allowlist secret
              jwtMacKey: 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0'
            }
          })
          await call('post')
        })
        it('should render the form with an error', () => {
          mockResponse.should.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            'simplified-account/settings/switch-psp/switch-to-worldpay/add-3ds-flex-credentials',
            {
              errors: {
                summary: [
                  {
                    text: 'Check your 3DS credentials, failed to link your account to Worldpay with credentials provided',
                    href: '#organisational-unit-id'
                  }
                ]
              },
              credentials: {
                organisationalUnitId: '5bd9b55e4444761ac0af1c80', // pragma: allowlist secret
                issuer: '5bd9e0e4444dce153428c940', // pragma: allowlist secret
                jwtMacKey: 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0'
              },
              backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
            }
          )
        })
      })
    })
  })
})
