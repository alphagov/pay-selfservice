'use strict'

const lodash = require('lodash')

const { response } = require('../utils/response')
const paths = require('../paths')
const serviceService = require('../services/service.service')
const userService = require('../services/user.service')
const {
  validateMandatoryField,
  validateOptionalField,
  SERVICE_NAME_MAX_LENGTH
} = require('../utils/validation/server-side-form-validations')

function get (req, res) {
  const pageData = lodash.get(req, 'session.pageData.createServiceName', {})
  lodash.unset(req, 'session.pageData.createServiceName')

  pageData.submit_link = paths.serviceSwitcher.create
  pageData.my_services = paths.serviceSwitcher.index

  return response(req, res, 'services/add-service', pageData)
}

async function post (req, res, next) {
  const { correlationId, body } = req
  const serviceName = body['service-name'] && body['service-name'].trim()
  const serviceHasNameCy = body['welsh-service-name-bool']
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
    lodash.set(req, 'session.pageData.createServiceName', {
      errors,
      current_name: serviceName,
      current_name_cy: serviceNameCy
    })
    return res.redirect(paths.serviceSwitcher.create)
  }

  try {
    const service = await serviceService.createService(serviceName, serviceNameCy, req.user, correlationId)
    await userService.assignServiceRole(req.user.externalId, service.externalId, 'admin', correlationId)
    res.redirect(paths.serviceSwitcher.index)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  get,
  post
}
