'use strict'

const lodash = require('lodash')

const { updateCurrentGoLiveStage, updateService } = require('../../../services/service.service')
const goLiveStage = require('../../../models/go-live-stage')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')
const { response } = require('../../../utils/response')
const { requestToGoLive } = require('../../../paths').service
const { validPaths, ServiceUpdateRequest } = require('../../../models/ServiceUpdateRequest.class')

const CHOOSE_TAKES_PAYMENTS_OVER_PHONE = 'choose-takes-payments-over-phone'

const updateServiceForTakesPaymentsOverPhone = async function (serviceExternalId, takesPaymentsOverPhone) {
  const updateRequest = new ServiceUpdateRequest()
    .replace(validPaths.takesPaymentsOverPhone, takesPaymentsOverPhone)

  return updateService(serviceExternalId, updateRequest.formatPayload())
}

module.exports = async function saveTakesPaymentsOverPhone (req, res, next) {
  const chooseTakesPaymentsOverPhone = req.body[CHOOSE_TAKES_PAYMENTS_OVER_PHONE]

  const errors = {}
  if (!chooseTakesPaymentsOverPhone) {
    errors['choose-takes-payments-over-phone'] = 'You need to select an option'
  }

  if (lodash.isEmpty(errors)) {
    try {
      await updateCurrentGoLiveStage(req.service.externalId, goLiveStage.GOV_BANKING_MOTO_OPTION_COMPLETED)
      await updateServiceForTakesPaymentsOverPhone(req.service.externalId,
        chooseTakesPaymentsOverPhone === 'true')

      res.redirect(303, formatServicePathsFor(requestToGoLive.agreement, req.service.externalId))
    } catch (err) {
      next(err)
    }
  } else {
    return response(req, res, 'request-to-go-live/choose-takes-payments-over-phone', {
      errors
    })
  }
}
