var nock = require('nock');
const userFixtures = require(__dirname + '/../unit/fixtures/user_fixtures');

var adminusersMock = nock(process.env.ADMINUSERS_URL);
const USER_RESOURCE = '/v1/api/users';

function mockUserResponse(userData, cb) {
  adminusersMock.get(`${USER_RESOURCE}/${userData.username}`).times(5)
    .reply(200, userFixtures.validUserResponse(userData).getPlain());

  cb();
}

module.exports = {
  mockUserResponse: mockUserResponse
};
