'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local Dependencies
const responses = require('../utils/response')
const paths = require('../paths')
const formatPath = require('../utils/replace-params-in-path')
const serviceService = require('../services/service.service')
const { validateServiceName } = require('../utils/service-name-validation')

exports.get = (req, res) => {
  let pageData = lodash.get(req, 'session.pageData.editServiceName')

  if (pageData) {
    delete req.session.pageData.editServiceName
  } else {
    pageData = {}
    pageData.current_name = req.service.serviceName
  }

  pageData.submit_link = formatPath(paths.editServiceName.update, req.service.externalId)
  pageData.my_services = paths.serviceSwitcher.index

  return responses.response(req, res, 'services/edit_service_name', pageData)
}

exports.post = (req, res) => {
  const correlationId = lodash.get(req, 'correlationId')
  const serviceExternalId = lodash.get(req, 'service.externalId')
  const serviceName = lodash.get(req, 'body.service-name')
  const hasServiceNameCy = lodash.get(req, 'body.welsh-service-name-bool', true)
  const serviceNameCy = hasServiceNameCy ? lodash.get(req, 'body.service-name-cy') : ''
  const validationErrors = validateServiceName(serviceName, 'service_name', true)
  const validationErrorsCy = validateServiceName(serviceNameCy, 'service_name_cy', false)

  if (Object.keys(validationErrors).length || Object.keys(validationErrorsCy).length) {
    lodash.set(req, 'session.pageData.editServiceName', {
      errors: validationErrors,
      current_name: lodash.merge({}, { en: serviceName, cy: serviceNameCy })
    })
    res.redirect(formatPath(paths.editServiceName.index, req.service.externalId))
  } else {
    return serviceService.updateServiceName(serviceExternalId, serviceName, serviceNameCy, correlationId)
      .then(() => {
        res.redirect(paths.serviceSwitcher.index)
      })
      .catch(err => {
        responses.renderErrorView(req, res, err)
      })
  }
}
