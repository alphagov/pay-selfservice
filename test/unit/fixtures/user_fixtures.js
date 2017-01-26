const _ = require('lodash');
var Pact = require('pact');
var matchers = Pact.Matchers;

function randomString() {
  return Math.random().toString(36).substring(7);
}

function randomUsername() {
  return randomString();
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

function withPactified(payload) {
  return {
    getPlain: () => payload,
    getPactified: () => pactify(payload)
  };
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

    return withPactified(request);
  },

  validCompleteUserCreateRequest: () => {

    let newUsername = randomUsername();
    let request = {
      username: newUsername,
      password: "arandompassword",
      otp_key: randomOtpKey(),
      email: `${newUsername}@example.com`,
      gateway_account_id: randomAccountId(),
      telephone_number: String(Math.floor(Math.random() * 1000000))
    };
    return withPactified(request);
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

    return withPactified(response);
  },

  invalidUserCreateRequestWithFieldsMissing: () => {
    let request = {
      gateway_account_id: randomAccountId()
    };

    return withPactified(request);
  },

  invalidUserCreateResponseWhenFieldsMissing: () => {
    let response = {
      errors: ["Field [username] is required", "Field [email] is required", "Field [telephone_number] is required", "Field [role_name] is required"]
    };

    return withPactified(response);
  },

  invalidCreateresponseWhenUsernameExists: () => {
    let response = {
      errors: ["username [existing-username] already exists"]
    };

    return withPactified(response);
  },

  validAuthenticateRequest: (options) => {
    let request = {
      username: options.username || 'username',
      password: options.password || 'password'
    };

    return withPactified(request);
  },

  unauthorizedUserResponse: () => {
    let response = {
      errors: ["invalid username and/or password"]
    };

    return withPactified(response);
  },

  badAuthenticateResponse: () => {
    let response = {
      errors: ["Field [username] is required", "Field [password] is required"]
    };

    return withPactified(response);
  },

  validIncrementSessionVersionRequest: () => {
    let request = {
      op: 'replace',
      path: 'sessionVersion',
      value: 1
    };

    return withPactified(request);

  },

  badIncrementSessionVersionResponse: () => {
    let response = {
      errors: ["Field [op] is required", "Field [path] is required", "Field [value] is required"]
    };

    return withPactified(response);
  },

  validForgottenPasswordCreateRequest: (username) => {
    let request = {
      username: username || 'username'
    };

    return withPactified(request);
  },

  validForgottenPasswordResponse: (request) => {
    let code = randomString();
    let response = {
      username: request.username || "username",
      code: request.code || code,
      date: '2010-12-31T22:59:59.132Z',
      "_links": [{
        "href": `http://localhost:8080/v1/api/forgotten-passwords/${code}`,
        "rel": "self",
        "method": "GET"
      }]
    };

    return withPactified(response);
  },

  badForgottenPasswordResponse: () => {
    let response = {
      errors: ["Field [username] is required"]
    };

    return withPactified(response);
  },

};
