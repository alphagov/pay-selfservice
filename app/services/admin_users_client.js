let request = require('request-promise');

/**
 * @param baseUrl
 *
 * @constructor
 */
function AdminUsersClient(baseUrl) {
  this.baseUrl = baseUrl;
  this.client = request.defaults({json: true});
}

AdminUsersClient.prototype = {

  authenticate: function (username, password) {

    let options = {
      uri: this.baseUrl + '/v1/api/users/authenticate',
      body: {
        username: username,
        password: password
      }
    };

    return this.client.post(options);
  }
};

module.exports.AdminUsersClient = AdminUsersClient;
