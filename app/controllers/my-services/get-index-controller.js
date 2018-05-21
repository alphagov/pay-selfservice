'use strict'

// NPM dependencies
const _ = require('lodash')

const {response} = require('../../utils/response')
const serviceService = require('../../services/service_service')
const getHeldPermissions = require('../../utils/get_held_permissions')

module.exports = (req, res) => {
  const servicesRoles = _.get(req, 'user.serviceRoles', [])
  const newServiceId = _.get(req, 'query.s')

  const reflect = promise => {
    return promise.then(function (v) {
      return {v: v, status: 'resolved'}
    },
      function (e) {
        return {e: e, status: 'rejected'}
      })
  }

  const displayMyServices = servicesData => {
    console.log(`Got ${servicesData.length} services`)
    console.log('yuh-YO ' + JSON.stringify(servicesData))
    const data = {
      services: servicesData,
      services_singular: servicesData.length === 1
    }
    if (newServiceId) {
      servicesData.filter(serviceData => {
        return serviceData.external_id === newServiceId
      }).forEach(service => {
        data.new_service_name = service.name
      })
    }
    return response(req, res, 'services/index', data)
  }

  const reflectPromises = servicesRoles.map(serviceRole => {
    return new Promise(function (resolve, reject) {
      serviceService.getGatewayAccounts(serviceRole.service.gatewayAccountIds, req.correlationId)
        .then(accounts => {
          accounts.sort((a, b) => a.type === b.type ? 0 : a.type === 'live' ? -1 : 1)
          const cardAccounts = accounts.filter(account => account.payment_method === undefined)
          const directdebitAccounts = accounts.filter(account => account.payment_method === 'direct debit')
          resolve({
            name: serviceRole.service.name === 'System Generated' ? 'Temporary Service Name' : serviceRole.service.name,
            external_id: serviceRole.service.externalId,
            gateway_accounts: {
              cardAccounts,
              directdebitAccounts
            },
            permissions: getHeldPermissions(serviceRole.role.permissions.map(permission => permission.name))
          })
        })
        .catch(() => reject(new Error('Error getting gateway account')))
    })
  })

  return Promise.all(reflectPromises.map(reflect))
    .then(serviceDataPromises =>
      serviceDataPromises
        .filter(promise => promise.status === 'resolved')
        .map(promise => promise.v)
    )
    .then(displayMyServices)
}
