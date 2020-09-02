'use strict'

const chai = require('chai')

const goLiveStageToNextPagePath = require('../../../../app/controllers/request-to-go-live/go-live-stage-to-next-page-path')
const goLiveStage = require('../../../../app/models/go-live-stage')

// Constants
const expect = chai.expect

describe('go-live-stage-to-next-page-path tests', () => {
  describe('should return "index" path', () => {
    const path = '/service/:externalServiceId/request-to-go-live'

    it('should resolve TERMS_AGREED_STRIPE stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.TERMS_AGREED_STRIPE]).to.equal(path)
    })
    it('should resolve TERMS_AGREED_WORLDPAY stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.TERMS_AGREED_WORLDPAY]).to.equal(path)
    })

    it('should resolve TERMS_AGREED_GOV_BANKIKNG_WORLDPAY stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.TERMS_AGREED_GOV_BANKING_WORLDPAY]).to.equal(path)
    })
    it('should resolve TERMS_AGREED_SMARTPAY stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.TERMS_AGREED_SMARTPAY]).to.equal(path)
    })
    it('should resolve TERMS_AGREED_EPDQ stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.TERMS_AGREED_EPDQ]).to.equal(path)
    })
    it('should resolve DENIED stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.DENIED]).to.equal(path)
    })
    it('should resolve LIVE stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.LIVE]).to.equal(path)
    })
  })

  describe('should return "organisation-name" path', () => {
    const path = '/service/:externalServiceId/request-to-go-live/organisation-name'

    it('should resolve NOT_STARTED stage correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.NOT_STARTED]).to.equal(path)
    })
  })

  describe('should return "organisation-address" path', () => {
    const path = '/service/:externalServiceId/request-to-go-live/organisation-address'

    it('should resolve ENTERED_ORGANISATION_NAME stage correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.ENTERED_ORGANISATION_NAME]).to.equal(path)
    })
  })

  describe('should return "choose-how-to-process-payments" path', () => {
    const path = '/service/:externalServiceId/request-to-go-live/choose-how-to-process-payments'

    it('should resolve ENTERED_ORGANISATION_ADDRESS stage correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.ENTERED_ORGANISATION_ADDRESS]).to.equal(path)
    })
  })

  describe('should return "agreement" path', () => {
    const path = '/service/:externalServiceId/request-to-go-live/agreement'

    it('should resolve CHOSEN_PSP_STRIPE stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.CHOSEN_PSP_STRIPE]).to.equal(path)
    })
    it('should resolve CHOSEN_PSP_WORLDPAY stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.CHOSEN_PSP_WORLDPAY]).to.equal(path)
    })

    it('should resolve CHOSEN_PSP_GOV_BANKING_WORLDPAY stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.CHOSEN_PSP_GOV_BANKING_WORLDPAY]).to.equal(path)
    })
    it('should resolve CHOSEN_PSP_SMARTPAY stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.CHOSEN_PSP_SMARTPAY]).to.equal(path)
    })
    it('should resolve CHOSEN_PSP_EPDQ stages correctly', () => {
      expect(goLiveStageToNextPagePath[goLiveStage.CHOSEN_PSP_EPDQ]).to.equal(path)
    })
  })
})
