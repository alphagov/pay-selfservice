const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const mockResponse = sinon.stub()
const mockUpdateMotoMaskCardNumber = sinon.spy()

const {
  req,
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/card-payments/moto-security/hide-card-number.controller')
  .withAccount({
    type: ACCOUNT_TYPE,
    allowMoto: true,
    motoMaskCardNumber: false
  })
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/card-payments.service': { updateMotoMaskCardNumber: mockUpdateMotoMaskCardNumber }
  })
  .build()

describe('Controller: settings/card-payments/moto-security/hide-card-number', () => {
  describe('get', () => {
    beforeEach(async () => {
      await call('get')
    })
    it('should call the response method with context', () => {
      sinon.assert.calledOnceWithExactly(mockResponse,
        req,
        res,
        'simplified-account/settings/card-payments/moto-security/hide-card-number',
        {
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE),
          currentState: 'off'
        }
      )
    })
  })

  describe('post', () => {
    describe('valid submission', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            hideCardNumber: 'on'
          }
        })
        await call('post')
      })

      it('should call updateMotoMaskCardNumber', () => {
        sinon.assert.calledOnceWithExactly(mockUpdateMotoMaskCardNumber,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE,
          true
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
            NOTHideCardNumber: 'blah'
          }
        })
        await call('post')
      })

      it('should not call updateMotoMaskCardNumber', () => {
        sinon.assert.notCalled(mockUpdateMotoMaskCardNumber)
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
                hideCardNumber: 'Select an option'
              },
              summary: [{
                text: 'Select an option',
                href: '#hide-card-number'
              }]
            }
          }
        )
      })
    })
  })
})
