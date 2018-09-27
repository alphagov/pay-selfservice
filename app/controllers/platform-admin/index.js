'use strict'

exports.getIndex = require('./get-index-controller')('live')
exports.getIndexTrialServices = require('./get-index-controller')('trial')
exports.getServiceTeamMembers = require('./get-service-team-members')
exports.getServiceOrganisationDetails = require('./get-service-organisation-details')
