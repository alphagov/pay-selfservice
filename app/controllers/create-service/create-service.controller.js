'use strict'

const _ = require('lodash')

const { response } = require('../../utils/response')
const paths = require('../../paths')
const logger = require('../../utils/logger')(__filename)
const serviceService = require('../../services/service.service')
const userService = require('../../services/user.service')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

function get (req, res) {
  const createServiceState = _.get(req, 'session.pageData.createService', {})
  const context = {
    ...createServiceState,
    back_link: paths.serviceSwitcher.index,
    submit_link: paths.serviceSwitcher.create.selectOrgType
  }
  _.unset(req, 'session.pageData.createService')
  return response(req, res, 'services/add-service', context)
}

async function post (req, res, next) {
  const createServiceState = _.get(req, 'session.pageData.createService', {})
  const serviceName = createServiceState.current_name.trim()
  const serviceNameCy = createServiceState.service_selected_cy && createServiceState.current_name_cy ? createServiceState.current_name_cy.trim() : ''
  const organisationType = req.body['select-org-type']
  if (organisationType && (organisationType === 'central' || organisationType === 'local')) {
    logger.info(`creating service with following details: ${JSON.stringify({
      serviceName,
      serviceNameCy,
      organisationType
    })}`)
    try {
      const { service, externalAccountId } = await serviceService.createService(serviceName, serviceNameCy, organisationType)
      await userService.assignServiceRole(req.user.externalId, service.externalId, 'admin')
      _.unset(req, 'session.pageData.createService')
      req.flash('messages', { state: 'success', icon: '&check;', content: 'We\'ve created your service.' })
      res.redirect(formatAccountPathsFor(paths.account.dashboard.index, externalAccountId))
    } catch (err) {
      next(err)
    }
  } else {
    _.set(req, 'session.pageData.createService.errors', {
      organisation_type: 'Organisation type is required'
    })
    return res.redirect(paths.serviceSwitcher.create.selectOrgType)
  }
}

module.exports = {
  get,
  post
}
