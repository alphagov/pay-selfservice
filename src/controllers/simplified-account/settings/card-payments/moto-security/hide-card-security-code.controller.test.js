const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const mockResponse = sinon.stub()
const mockUpdateMotoMaskSecurityCode = sinon.spy()

const {
  req,
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/card-payments/moto-security/hide-card-security-code.controller')
  .withAccount({
    type: ACCOUNT_TYPE,
    allowMoto: true,
    motoMaskCardSecurityCode: true
  })
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/card-payments.service': { updateMotoMaskSecurityCode: mockUpdateMotoMaskSecurityCode }
  })
  .build()

describe('Controller: settings/card-payments/moto-security/hide-card-security-code', () => {
  describe('get', () => {
    beforeEach(async () => {
      await call('get')
    })
    it('should call the response method with context', () => {
      sinon.assert.calledOnceWithExactly(mockResponse,
        req,
        res,
        'simplified-account/settings/card-payments/moto-security/hide-card-security-code',
        {
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE),
          currentState: 'on'
        }
      )
    })
  })

  describe('post', () => {
    describe('valid submission', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            hideCardSecurityCode: 'off'
          }
        })
        await call('post')
      })

      it('should call updateMotoMaskSecurityCode', () => {
        sinon.assert.calledOnceWithExactly(mockUpdateMotoMaskSecurityCode,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE,
          false
        )
      })

      it('should redirect the user on success', () => {
        sinon.assert.calledOnceWithExactly(res.redirect,
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        )
      })
    })
    describe('invalid submission', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            // empty form submission
          }
        })
        await call('post')
      })

      it('should not call updateMotoMaskSecurityCode', () => {
        sinon.assert.notCalled(mockUpdateMotoMaskSecurityCode)
      })

      it('should not redirect the user', () => {
        sinon.assert.notCalled(res.redirect)
      })

      it('should call the response method with errors', () => {
        sinon.assert.calledWithMatch(mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          {
            errors: {
              formErrors: {
                hideCardSecurityCode: 'Select an option'
              },
              summary: [{
                text: 'Select an option',
                href: '#hide-card-security-code'
              }]
            }
          }
        )
      })
    })
  })
})
