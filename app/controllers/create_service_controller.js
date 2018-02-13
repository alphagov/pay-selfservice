'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local Dependencies
const responses = require('../utils/response')
const paths = require('../paths')
const serviceService = require('../services/service_service')
const userService = require('../services/user_service')
const {validateServiceName} = require('../utils/service_name_validation')

exports.get = (req, res) => {
  let pageData = lodash.get(req, 'session.pageData.createServiceName')

  if (pageData) {
    delete req.session.pageData.createServiceName
  } else {
    pageData = {}
    pageData.current_name = ''
  }

  pageData.submit_link = paths.serviceSwitcher.create
  pageData.my_services = paths.serviceSwitcher.index

  return responses.response(req, res, 'services/add_service', pageData)
}

exports.post = (req, res) => {
  const correlationId = lodash.get(req, 'correlationId')
  const serviceName = lodash.get(req, 'body.service-name')
  const validationErrors = validateServiceName(serviceName)
  if (validationErrors) {
    lodash.set(req, 'session.pageData.createServiceName', {
      errors: validationErrors,
      current_name: serviceName
    })
    res.redirect(paths.serviceSwitcher.create)
  } else {
    return serviceService.createService(serviceName, correlationId)
      .then((service) => userService.assignServiceRole(req.user.externalId, service.external_id, 'admin', correlationId))
      .then(() => {
        res.redirect(paths.serviceSwitcher.index)
      })
      .catch(err => {
        responses.renderErrorView(req, res, err)
      })
  }
}
