'use strict'

const _ = require('lodash')

const { response } = require('../../utils/response')
const paths = require('../../paths')
const serviceService = require('../../services/service.service')
const userService = require('../../services/user.service')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const formatServiceAndAccountPathsFor = require('@utils/simplified-account/format/format-service-and-account-paths-for')

function get (req, res) {
  const createServiceState = _.get(req, 'session.pageData.createService', {})
  const context = {
    ...createServiceState,
    back_link: paths.services.index,
    submit_link: paths.services.create.selectOrgType
  }
  _.unset(req, 'session.pageData.createService')
  return response(req, res, 'services/add-service', context)
}

async function post (req, res, next) {
  const createServiceState = _.get(req, 'session.pageData.createService', {})
  const serviceName = createServiceState.current_name.trim()
  const serviceNameCy = createServiceState.service_selected_cy && createServiceState.current_name_cy ? createServiceState.current_name_cy.trim() : ''
  const organisationType = req.body['select-org-type']
  if (!organisationType && (organisationType !== 'central' || organisationType !== 'local')) {
    _.set(req, 'session.pageData.createService.errors', {
      organisation_type: 'Organisation type is required'
    })
    return res.redirect(paths.services.create.selectOrgType)
  }

  try {
    const {
      service
    } = await serviceService.createService(serviceName, serviceNameCy, organisationType)
    await userService.assignServiceRole(req.user.externalId, service.externalId, 'admin')
    _.unset(req, 'session.pageData.createService')
    req.flash('messages', { state: 'success', icon: '&check;', heading: 'We\'ve created your service.' })
    res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.dashboard.index, service.externalId, 'test'))
  } catch (err) {
    next(err)
  }
}

module.exports = {
  get,
  post
}
