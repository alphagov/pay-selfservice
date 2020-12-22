'use strict'

const pactBase = require('./pact-base')

const defaultPactifier = pactBase()

const userResponsePactifier = pactBase({
  array: ['service_roles', '_links'],
  length: [{ key: 'permissions', length: 1 }]
})

module.exports = {
  defaultPactifier,
  userResponsePactifier
}
