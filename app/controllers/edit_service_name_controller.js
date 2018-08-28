'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local Dependencies
const responses = require('../utils/response')
const paths = require('../paths')
const formatPath = require('../utils/replace_params_in_path')
const serviceService = require('../services/service_service')
const {validateServiceName} = require('../utils/service_name_validation')

exports.get = (req, res) => {
  let pageData = lodash.get(req, 'session.pageData.editServiceName')

  if (pageData) {
    delete req.session.pageData.editServiceName
  } else {
    pageData = {}
    pageData.current_name = req.service.name === 'System Generated' ? '' : req.service.name
  }

  pageData.submit_link = formatPath(paths.editServiceName.update, req.service.externalId)
  pageData.my_services = paths.serviceSwitcher.index

  return responses.response(req, res, 'services/edit_service_name', pageData)
}

exports.post = (req, res) => {
  const correlationId = lodash.get(req, 'correlationId')
  const serviceExternalId = lodash.get(req, 'service.externalId')
  const serviceName = lodash.get(req, 'body.service-name')
  const validationErrors = validateServiceName(serviceName)
  if (validationErrors) {
    lodash.set(req, 'session.pageData.editServiceName', {
      errors: validationErrors,
      current_name: serviceName
    })
    res.redirect(formatPath(paths.editServiceName.index, req.service.externalId))
  } else {
    return serviceService.updateServiceName(serviceExternalId, serviceName, correlationId)
      .then(() => {
        res.redirect(paths.serviceSwitcher.index)
      })
      .catch(err => {
        responses.renderErrorView(req, res, err)
      })
  }
}
