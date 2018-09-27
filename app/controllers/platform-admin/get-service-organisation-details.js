'use strict'

// NPM dependencies
const logger = require('winston')

// Local dependencies
const paths = require('../../paths')
const formatPath = require('../../utils/replace_params_in_path')
const {response, renderErrorView} = require('../../utils/response')
const {mapByRoles} = require('../../utils/roles')
const userService = require('../../services/user_service')

module.exports = (req, res) => {
  const externalServiceId = req.params.externalServiceId

  // Get merchant details by getting the admin user for the service from Adminusers,
  // then extracting the merchant details from the service
  userService.getServiceUsers(externalServiceId, req.correlationId)
    .then(members => {
      const teamMembers = mapByRoles(members, externalServiceId, {externalId: null})
      const adminUser = teamMembers.admin.length > 0 ? teamMembers.admin[0] : null
      if (adminUser) {
        userService.findByExternalId(adminUser.external_id, req.correlationId)
          .then(user => {
            const serviceRole = user.serviceRoles.find(serviceRole => serviceRole.service.externalId === externalServiceId)
            const pageData = {
              merchantDetails: serviceRole.service.merchantDetails,
              serviceName: serviceRole.service.name,
              editPath: formatPath(paths.merchantDetails.edit, externalServiceId)
            }
            return response(req, res, 'platform-admin/service-organisation-details', pageData)
          })
          .catch(err => {
            logger.error(`[requestId=${req.correlationId}] error retrieving user ${adminUser.external_id} for service ${externalServiceId}. [${err}]`)
            renderErrorView(req, res, 'Unable to view organisation details')
          })
      } else {
        logger.error(`[requestId=${req.correlationId}] unable to find admin user for service ${externalServiceId} to extract merchant details`)
      }
    })
    .catch(err => {
      logger.error(`[requestId=${req.correlationId}] error retrieving users for service ${externalServiceId}. [${err}]`)
      renderErrorView(req, res, 'Unable to view organisation details')
    })
}
