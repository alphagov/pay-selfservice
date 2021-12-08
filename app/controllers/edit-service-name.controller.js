'use strict'

const lodash = require('lodash')

const responses = require('../utils/response')
const paths = require('../paths')
const formatServicePathsFor = require('../utils/format-service-paths-for')
const serviceService = require('../services/service.service')
const { validateServiceName } = require('../utils/service-name-validation')

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
  const correlationId = lodash.get(req, 'correlationId')
  const serviceExternalId = lodash.get(req, 'service.externalId')
  const serviceName = lodash.get(req, 'body.service-name')
  const hasServiceNameCy = lodash.get(req, 'body.welsh-service-name-bool', true)
  const serviceNameCy = hasServiceNameCy ? lodash.get(req, 'body.service-name-cy') : ''
  const validationErrors = {
    ...validateServiceName(serviceName, 'service_name', true),
    ...validateServiceName(serviceNameCy, 'service_name_cy', false)
  }
  if (Object.keys(validationErrors).length) {
    lodash.set(req, 'session.pageData.editServiceName', {
      errors: validationErrors,
      current_name: lodash.merge({}, { en: serviceName, cy: serviceNameCy })
    })
    res.redirect(formatServicePathsFor(paths.service.editServiceName.index, req.service.externalId))
  } else {
    try {
      await serviceService.updateServiceName(serviceExternalId, serviceName, serviceNameCy, correlationId)
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
