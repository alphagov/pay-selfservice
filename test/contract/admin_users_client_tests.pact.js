let expect = require('chai').expect;
let AdminUsersClient = require('../../app/services/admin_users_client').AdminUsersClient;
let pactProxy = require(__dirname + '/../test_helpers/pact/pact_proxy.js');
let Pact = require('pact');

const mockPort = 65535;
const mockServer = pactProxy.create(mockPort);
const client = new AdminUsersClient('http://localhost:' + mockPort);

describe('users admin client', function () {

  let adminUsersMock;

  beforeEach('Set up mock server and pact',function(done) {
    mockServer.start().then(function() {
      adminUsersMock = Pact({ consumer: 'Selfservice', provider: 'AdminUsers', port: mockPort});
      done()
    });
  });

  afterEach('Delete the server and publish pacts to broker', function (done) {
    mockServer.delete().then(function () {
      pactProxy.publish().then(function () {
          done();
        },
        function (err) {
          console.log(err);
          done();
        });
    })
  });

  it('should authenticate user', function (done) {

    let stateName = {
      aSuccessfulAuthentication: 'a user authenticates with valid username and password'
    };

    let data = {
      username: 'bob',
      password: 'superSecuredPassword'
    };

    let response = {
      status: 200,
      headers: {}
      "username": "bob",
      "email": "bob@isgreat.com",
      "gateway_account_id": 1,
      "otp_key": "abc123",
      "login_count": 1,
      "disabled": false,
      "role.name": "admin",
      "permissions": ["a", "b"],
    };

    /*nock(process.env.ADMIN_USERS_URL)
      .post('/v1/api/users/authenticate', data)
      .reply(200, );*/


    adminUsersMock.addInteraction({
      state: stateName,
      uponReceiving: '',
      willRespondWith:

    })
      .then(()=>{
        client.authenticate('bob', 'superSecuredPassword')
          .then((user) => {
            expect(user.username).to.equal("bob");
            done();
          });
      });
  });

  it.skip('should fail authentication when response is 401 Unauthorised', function (done) {
    // Not handled yet
  });

  it.skip('should error user authentication', function (done) {
    // Not handled yet
  });

});
