'use strict'

import { Features } from '@root/config/features'

const goLiveStage = require('@models/constants/go-live-stage')
const paths = require('../../../paths')
const response = require('../../../utils/response')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')

module.exports = (req, res) => {
  // redirect on wrong stage
  if (req.service.currentGoLiveStage !== goLiveStage.ENTERED_ORGANISATION_ADDRESS) {
    return res.redirect(
      303,
      formatServicePathsFor(paths.service.requestToGoLive.index, req.service.externalId)
    )
  }
  const isAdyenEnabled = Features.isAdyenEnabledInGoLiveRequest() || 
  Boolean(req?.service?.features?.includes('govuk_psp_is_adyen'))

  return response.response(req, res, 'request-to-go-live/choose-how-to-process-payments', {isAdyenEnabled})
}
