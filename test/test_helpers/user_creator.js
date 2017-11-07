let path = require('path')
let nock = require('nock')
const userFixtures = require(path.join(__dirname, '/../fixtures/user_fixtures'))

let adminusersMock = nock(process.env.ADMINUSERS_URL)
const USER_RESOURCE = '/v1/api/users'

function mockUserResponse (userData, cb) {
  adminusersMock.get(`${USER_RESOURCE}/${userData.external_id}`).times(5)
    .reply(200, userFixtures.validUserResponse(userData).getPlain())

  adminusersMock.get(`${USER_RESOURCE}?username=${userData.username}`).times(5)
    .reply(200, userFixtures.validUserResponse(userData).getPlain())

  if (cb) cb()
}

module.exports = {
  mockUserResponse: mockUserResponse
}
