'use strict'

const path = require('path')

const userFixtures = require(path.join(__dirname, '/user.fixtures'))
const pactBase = require(path.join(__dirname, '/pact-base'))

// Global setup
const pactServices = pactBase({ array: ['service_ids'] })

module.exports = {

  /**
   * @param users Array params override get users response
   * @return {{getPactified: (function()) Pact response, getPlain: (function()) request with overrides applied}}
   */
  validServiceUsersResponse: (users) => {
    let data = []
    for (let user of users) {
      data.push(userFixtures.validUserResponse(user))
    }
    return {
      getPactified: () => {
        return pactServices.pactifyNestedArray(data)
      },
      getPlain: () => {
        return data
      }
    }
  }
}
