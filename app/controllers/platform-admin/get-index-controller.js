'use strict'

// local dependencies
const {response} = require('../../utils/response')

module.exports = (type) => (req, res) => {
  const data = {
    services: req.user.adminServiceRoles.services.map(adminServiceRole => {
      return {
        name: adminServiceRole.service.name,
        external_id: adminServiceRole.service.externalId
      }
    }),
    showing_live_services: (type === 'live'),
    permissions: {},
    path: req.path
  }
  return response(req, res, 'platform-admin/index', data)
}
