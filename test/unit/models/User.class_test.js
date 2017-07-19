'use strict'
// NPM dependencies
const {expect} = require('chai')

// Local dependencies
const User = require('../../../app/models/User.class')
const userFixtures = require('../../fixtures/user_fixtures')

// Assignments etc
let user, service, result, permission, role

describe('Class: User', () => {
  before(() => {
    user = new User(userFixtures.validUserResponse().getPlain())
    service = user.serviceRoles[0].service
    permission = user.serviceRoles[0].role.permissions[0].name
    role = user.serviceRoles[0].role
  })

  describe('Method: hasPermission', () => {
    it('should return true if the user has the specified permission on the specified service', () => {
      result = user.hasPermission(service.externalId, permission)
      expect(result).to.equal(true)
    })

    it('should return false if the user does not have the specified permission on the specified service', () => {
      result = user.hasPermission(service.externalId, 'absent-permission')
      expect(result).to.equal(false)
    })

    it('should return false if the user does not belong to the specified service', () => {
      result = user.hasPermission('non-accessible-service', permission)
      expect(result).to.equal(false)
    })
  })

  describe('Method: getRoleForService', () => {
    it('should return the user\'s role if user has access to service', () => {
      result = user.getRoleForService(service.externalId)
      expect(result).to.deep.equal(role)
    })

    it('should return undefined if user does not have access to service', () => {
      result = user.getRoleForService('non-accessible-service')
      expect(result).to.be.undefined  // eslint-disable-line
    })
  })

  describe('Method: hasService', () => {
    it('should return true if user has access to service', () => {
      result = user.hasService(service.externalId)
      expect(result).to.equal(true)
    })

    it('should return false if user does not have access to service', () => {
      result = user.hasService('non-accessible-service')
      expect(result).to.equal(false)
    })
  })

  describe('Method: getPermissionsForService', () => {
    it('should return flattened permissions from a serviceRole of a user', () => {
      result = user.getPermissionsForService(service.externalId)
      expect(result).to.include('perm-1')
    })
  })
})
