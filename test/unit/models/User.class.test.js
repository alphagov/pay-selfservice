'use strict'

const User = require('../../../app/models/User.class')
const userFixtures = require('../../fixtures/user.fixtures')

// Assignments etc
let user, service, result, permission, role

describe('Class: User', () => {
  beforeAll(() => {
    user = new User(userFixtures.validUserResponse().getPlain())
    service = user.serviceRoles[0].service
    permission = user.serviceRoles[0].role.permissions[0].name
    role = user.serviceRoles[0].role
  })

  describe('Method: hasPermission', () => {
    it(
      'should return true if the user has the specified permission on the specified service',
      () => {
        result = user.hasPermission(service.externalId, permission)
        expect(result).toBe(true)
      }
    )

    it(
      'should return false if the user does not have the specified permission on the specified service',
      () => {
        result = user.hasPermission(service.externalId, 'absent-permission')
        expect(result).toBe(false)
      }
    )

    it(
      'should return false if the user does not belong to the specified service',
      () => {
        result = user.hasPermission('non-accessible-service', permission)
        expect(result).toBe(false)
      }
    )
  })

  describe('Method: getRoleForService', () => {
    it('should return the user\'s role if user has access to service', () => {
      result = user.getRoleForService(service.externalId)
      expect(result).toEqual(role)
    })

    it('should return undefined if user does not have access to service', () => {
      result = user.getRoleForService('non-accessible-service')
      expect(result).toBeUndefined()  // eslint-disable-line
    })
  })

  describe('Method: hasService', () => {
    it('should return true if user has access to service', () => {
      result = user.hasService(service.externalId)
      expect(result).toBe(true)
    })

    it('should return false if user does not have access to service', () => {
      result = user.hasService('non-accessible-service')
      expect(result).toBe(false)
    })
  })

  describe('Method: getPermissionsForService', () => {
    it(
      'should return flattened permissions from a serviceRole of a user',
      () => {
        result = user.getPermissionsForService(service.externalId)
        expect(result).toEqual(expect.arrayContaining([permission]))
      }
    )
  })
})
