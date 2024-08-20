'use strict'

const _ = require('lodash')

const { response } = require('../../utils/response')
const paths = require('../../paths')
const logger = require('../../utils/logger')(__filename)
const serviceService = require('../../services/service.service')
const userService = require('../../services/user.service')

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
    // todo create stripe / sandbox account depending on org type
    // try {
    //   const service = await serviceService.createService(serviceName, serviceNameCy, req.user)
    //   await userService.assignServiceRole(req.user.externalId, service.externalId, 'admin')
    //   res.redirect(paths.serviceSwitcher.index)
    // } catch (err) {
    //   next(err)
    // }
    _.unset(req, 'session.pageData.createService')
    res.redirect(paths.serviceSwitcher.index)
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
