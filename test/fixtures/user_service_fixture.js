'use strict'

const userFixtures = require('./user_fixtures')
const { pactifyNestedArray } = require('./pact_base')

module.exports = {

  /**
   * @param users Array params override get users response
   * @return {{getPactified: (function()) Pact response, getPlain: (function()) request with overrides applied}}
   */
  validServiceUsersResponse: (users) => {
    let data = []
    for (let user of users) {
      data.push(userFixtures.validUserResponse(user).getPlain())
    }
    return {
      getPactified: () => {
        return pactifyNestedArray(data)
      },
      getPlain: () => {
        return data
      }
    }
  }
}
