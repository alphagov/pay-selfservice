const _ = require('lodash');
var Pact = require('pact');
var matchers = Pact.Matchers;

function randomUsername() {
  return Math.random().toString(36).substring(7);
}

function randomOtpKey() {
  return String(Math.floor(Math.random() * 100000))
}

function randomAccountId() {
  return String(Math.floor(Math.random() * 10));
}

function randomTelephoneNumber() {
 return String(Math.floor(Math.random() * 1000000));
}

function pactify(request) {
  let pactified = {};
  _.forIn(request, (value, key) => {
    pactified[key] = matchers.somethingLike(value);
  });

  return pactified;
}

module.exports = {

  validMinimalUserCreateRequest: () => {

    let newUsername = randomUsername();

    let request = {
      username: newUsername,
      email: `${newUsername}@example.com`,
      gateway_account_id: String(Math.floor(Math.random() * 10)),
      telephone_number: String(Math.floor(Math.random() * 1000000))
    };

    return {
      getPlain: () => request,
      getPactified: () => pactify(request)
    };
  },

  validCompleteUserCreateRequest: () => {

    let newUsername = randomUsername();
    return {
      username: newUsername,
      password: "arandompassword",
      otp_key: randomOtpKey(),
      email: `${newUsername}@example.com`,
      gateway_account_id: randomAccountId(),
      telephone_number: String(Math.floor(Math.random() * 1000000))
    };
  },

  validUserResponse: (request) => {

    var response = {
      username: request.username,
      email: request.email || `${request.username}@example.com`,
      password: request.password || "random-password",
      gateway_account_id: request.gateway_account_id || randomAccountId(),
      telephone_number: request.telephone_number || randomTelephoneNumber(),
      otp_key: request.otp_key || "43c3c4t",
      role: {"name": "admin", "description": "Administrator"},
      permissions: ["perm-1", "perm-2", "perm-3"],
      "_links": [{
        "href": `http://adminusers.service/v1/api/users/${request.username}`,
        "rel": "self",
        "method": "GET"
      }]
    };

    return {
      getPlain: () => response,
      getPactified: () => pactify(response)
    };
  },

  invalidUserCreateRequestWithFieldsMissing: () => {
    let request = {
      gateway_account_id: randomAccountId()
    };

    return {
      getPlain: () => request,
      getPactified: () => pactify(request)
    };
  },

  invalidUserCreateResponseWhenFieldsMissing: () => {
    let response = {
      errors: ["Field [username] is required", "Field [email] is required", "Field [telephone_number] is required", "Field [role_name] is required"]
    };

    return {
      getPlain: () => response,
      getPactified: () => pactify(response)
    };
  },

  invalidCreateresponseWhenUsernameExists: () => {
    let response = {
      errors: ["username [existing-username] already exists"]
    };

    return {
      getPlain: () => response,
      getPactified: () => pactify(response)
    };
  }

};
