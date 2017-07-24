'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local Dependencies
const responses = require('../utils/response')
const paths = require('../paths')
const formatPath = require('../utils/replace_params_in_path')
const serviceService = require('../services/service_service')
const ServiceNameField = require('../models/form-fields/ServiceNameField.class')

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

  return responses.response(req, res, 'edit_service_name', pageData)
}

exports.post = (req, res) => {
  const correlationId = lodash.get(req, 'correlationId')
  const serviceExternalId = lodash.get(req, 'service.externalId')
  const serviceName = new ServiceNameField(lodash.get(req, 'body.service-name'))

  if (serviceName.validate()) {
    return serviceService.updateServiceName(serviceExternalId, serviceName.value, correlationId)
      .then(() => {
        res.redirect(paths.serviceSwitcher.index)
      })
      .catch(err => {
        responses.renderErrorView(req, res, err)
      })
  } else {
    lodash.set(req, 'session.pageData.editServiceName', {
      errors: {
        service_name: serviceName.errors
      },
      current_name: serviceName.value
    })
    res.redirect(formatPath(paths.editServiceName.index, req.service.externalId))
  }
}
