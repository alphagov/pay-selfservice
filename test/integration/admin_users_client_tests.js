let expect = require('chai').expect;
let nock = require('nock');
let AdminUsersClient = require('../../app/services/admin_users_client').AdminUsersClient;
let client = new AdminUsersClient(process.env.ADMIN_USERS_URL);

describe('users admin client', function () {

  it('should authenticate user', function (done) {

    let data = {
      username: 'bob',
      password: 'superSecuredPassword'
    };

    nock(process.env.ADMIN_USERS_URL)
      .post('/v1/api/users/authenticate', data)
      .reply(200, {
        "username": "bob",
        "email": "bob@isgreat.com",
        "gateway_account_id": 1,
        "otp_key": "abc123",
        "login_count": 1,
        "disabled": false,
        "role.name": "admin",
        "permissions": ["a", "b"],
      });

    client.authenticate('bob', 'superSecuredPassword')
      .then((user) => {
        expect(user.username).to.equal("bob");
        done();
      });
  });

  it.skip('should fail authentication when response is 401 Unauthorised', function (done) {
    // Not handled yet
  });

  it.skip('should error user authentication', function (done) {
    // Not handled yet
  });

});
