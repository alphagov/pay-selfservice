'use strict'

const lodash = require('lodash')

const { renderErrorView, response } = require('../utils/response')
const paths = require('../paths')
const serviceService = require('../services/service.service')
const userService = require('../services/user.service')
const { validateServiceName } = require('../utils/service-name-validation')

function get (req, res) {
  let pageData = lodash.get(req, 'session.pageData.createServiceName')

  if (pageData) {
    delete req.session.pageData.createServiceName
  } else {
    pageData = {}
    pageData.current_name = ''
    pageData.current_name_cy = ''
  }

  pageData.submit_link = paths.serviceSwitcher.create
  pageData.my_services = paths.serviceSwitcher.index

  return response(req, res, 'services/add-service', pageData)
}

async function post (req, res) {
  const correlationId = lodash.get(req, 'correlationId')
  const serviceName = lodash.get(req, 'body.service-name')
  const serviceHasNameCy = lodash.get(req, 'body.welsh-service-name-bool')
  const serviceNameCy = serviceHasNameCy ? lodash.get(req, 'body.service-name-cy') : ''
  const validationErrors = validateServiceName(serviceName, 'service_name', true)
  const validationErrorsCy = validateServiceName(serviceNameCy, 'service_name_cy', false)
  if (Object.keys(validationErrors).length || Object.keys(validationErrorsCy).length) {
    lodash.set(req, 'session.pageData.createServiceName', {
      errors: { ...validationErrors, ...validationErrorsCy },
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
    renderErrorView(req, res, err)
  }
}

module.exports = {
  get,
  post
}
