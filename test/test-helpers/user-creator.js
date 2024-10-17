const path = require('path')
const nock = require('nock')
const userFixtures = require(path.join(__dirname, '/../fixtures/user.fixtures'))

const adminusersMock = nock(process.env.ADMINUSERS_URL)
const USER_RESOURCE = '/v1/api/users'

function mockUserResponse (userData, cb) {
  adminusersMock.get(`${USER_RESOURCE}/${userData.external_id}`).times(5)
    .reply(200, userFixtures.validUserResponse(userData))

  adminusersMock.get(`${USER_RESOURCE}?username=${userData.username}`).times(5)
    .reply(200, userFixtures.validUserResponse(userData))

  if (cb) cb()
}

module.exports = {
  mockUserResponse
}
