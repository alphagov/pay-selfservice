'use strict'

// NPM dependencies
const _ = require('lodash')

// Local dependencies
const paths = require('../paths')
const formattedPathFor = require('./replace_params_in_path')

// Constants
const roles = {
  'admin': {extId: 200, name: 'admin', description: 'Administrator'},
  'view-and-refund': {extId: 300, name: 'view-and-refund', description: 'View and refund'},
  'view-only': {extId: 400, name: 'view-only', description: 'View only'}
}

module.exports = {
  roles: roles,
  getRoleByExtId: roleExtId => {
    let found
    _.toArray(roles).forEach(role => {
      if (role.extId === roleExtId) {
        found = role
      }
    })
    return found
  },
  mapByRoles: (users, externalServiceId, currentUser) => {
    let userRolesMap = {}
    for (const role in roles) {
      userRolesMap[roles[role].name] = []
    }
    users.map(user => {
      const userRoleName = _.get(user.getRoleForService(externalServiceId), 'name')
      if (roles[userRoleName]) {
        const mappedUser = {
          username: user.username,
          external_id: user.externalId
        }
        if (currentUser.externalId === user.externalId) {
          mappedUser.is_current = true
          mappedUser.link = paths.user.profile
        } else {
          mappedUser.link = formattedPathFor(paths.teamMembers.show, externalServiceId, user.externalId)
        }
        userRolesMap[userRoleName].push(mappedUser)
      }
    })
    return userRolesMap
  },
  mapInvitesByRoles: invitedUsers => {
    let userRolesMap = {}
    for (const role in roles) {
      userRolesMap[roles[role].name] = []
    }
    invitedUsers.map((user) => {
      if (roles[user.role]) {
        const mappedUser = {
          username: user.email,
          expired: user.expired
        }
        userRolesMap[user.role].push(mappedUser)
      }
    })
    return userRolesMap
  }
}
