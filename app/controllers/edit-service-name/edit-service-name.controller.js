'use strict'

const lodash = require('lodash')

const responses = require('../../utils/response')
const paths = require('../../paths')
const formatServicePathsFor = require('../../utils/format-service-paths-for')
const serviceService = require('../../services/service.service')
const {
  validateMandatoryField,
  validateOptionalField,
  SERVICE_NAME_MAX_LENGTH
} = require('../../utils/validation/server-side-form-validations')

function getServiceName (req, res) {
  let pageData = lodash.get(req, 'session.pageData.editServiceName')

  if (pageData) {
    delete req.session.pageData.editServiceName
  } else {
    pageData = {}
    pageData.current_name = req.service.serviceName
  }

  pageData.submit_link = formatServicePathsFor(paths.service.editServiceName.update, req.service.externalId)
  pageData.my_services = paths.serviceSwitcher.index

  return responses.response(req, res, 'services/edit-service-name', pageData)
}

async function postEditServiceName (req, res, next) {
  const { body } = req
  const serviceExternalId = req.service.externalId
  const serviceName = body['service-name'] && body['service-name'].trim()
  const serviceHasNameCy = body['welsh-service-name-bool'] !== undefined ? body['welsh-service-name-bool'] : true
  const serviceNameCy = serviceHasNameCy ? body['service-name-cy'] && body['service-name-cy'].trim() : ''

  const errors = {}
  const nameValidationResult = validateMandatoryField(serviceName, SERVICE_NAME_MAX_LENGTH, 'service name')
  if (!nameValidationResult.valid) {
    errors['service_name'] = nameValidationResult.message
  }
  const welshNameValidationResult = validateOptionalField(serviceNameCy, SERVICE_NAME_MAX_LENGTH, 'welsh service name')
  if (!welshNameValidationResult.valid) {
    errors['service_name_cy'] = welshNameValidationResult.message
  }
  if (!lodash.isEmpty(errors)) {
    lodash.set(req, 'session.pageData.editServiceName', {
      errors,
      current_name: {
        en: serviceName,
        cy: serviceNameCy
      }
    })
    res.redirect(formatServicePathsFor(paths.service.editServiceName.index, req.service.externalId))
  } else {
    try {
      await serviceService.updateServiceName(serviceExternalId, serviceName, serviceNameCy)
      res.redirect(paths.serviceSwitcher.index)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = {
  get: getServiceName,
  post: postEditServiceName
}
