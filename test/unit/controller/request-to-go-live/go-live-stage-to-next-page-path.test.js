'use strict'

const goLiveStageToNextPagePath = require('../../../../app/controllers/request-to-go-live/go-live-stage-to-next-page-path')
const goLiveStage = require('../../../../app/models/go-live-stage')

// Constants

describe('go-live-stage-to-next-page-path tests', () => {
  describe('should return "index" path', () => {
    const path = '/service/:externalServiceId/request-to-go-live'

    it('should resolve TERMS_AGREED_STRIPE stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.TERMS_AGREED_STRIPE]).toBe(path)
    })
    it('should resolve TERMS_AGREED_WORLDPAY stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.TERMS_AGREED_WORLDPAY]).toBe(path)
    })

    it(
      'should resolve TERMS_AGREED_GOV_BANKIKNG_WORLDPAY stages correctly',
      () => {
        expect(goLiveStageToNextPagePath[goLiveStage.TERMS_AGREED_GOV_BANKING_WORLDPAY]).toBe(path)
      }
    )
    it('should resolve TERMS_AGREED_SMARTPAY stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.TERMS_AGREED_SMARTPAY]).toBe(path)
    })
    it('should resolve TERMS_AGREED_EPDQ stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.TERMS_AGREED_EPDQ]).toBe(path)
    })
    it('should resolve DENIED stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.DENIED]).toBe(path)
    })
    it('should resolve LIVE stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.LIVE]).toBe(path)
    })
  })

  describe('should return "organisation-name" path', () => {
    const path = '/service/:externalServiceId/request-to-go-live/organisation-name'

    it('should resolve NOT_STARTED stage correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.NOT_STARTED]).toBe(path)
    })
  })

  describe('should return "organisation-address" path', () => {
    const path = '/service/:externalServiceId/request-to-go-live/organisation-address'

    it('should resolve ENTERED_ORGANISATION_NAME stage correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.ENTERED_ORGANISATION_NAME]).toBe(path)
    })
  })

  describe('should return "choose-how-to-process-payments" path', () => {
    const path = '/service/:externalServiceId/request-to-go-live/choose-how-to-process-payments'

    it('should resolve ENTERED_ORGANISATION_ADDRESS stage correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.ENTERED_ORGANISATION_ADDRESS]).toBe(path)
    })
  })

  describe('should return "agreement" path', () => {
    const path = '/service/:externalServiceId/request-to-go-live/agreement'

    it('should resolve CHOSEN_PSP_STRIPE stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.CHOSEN_PSP_STRIPE]).toBe(path)
    })
    it('should resolve CHOSEN_PSP_WORLDPAY stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.CHOSEN_PSP_WORLDPAY]).toBe(path)
    })

    it('should resolve CHOSEN_PSP_GOV_BANKING_WORLDPAY stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.CHOSEN_PSP_GOV_BANKING_WORLDPAY]).toBe(path)
    })
    it('should resolve CHOSEN_PSP_SMARTPAY stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.CHOSEN_PSP_SMARTPAY]).toBe(path)
    })
    it('should resolve CHOSEN_PSP_EPDQ stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.CHOSEN_PSP_EPDQ]).toBe(path)
    })
  })
})
