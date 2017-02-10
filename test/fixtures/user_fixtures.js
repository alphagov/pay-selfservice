const _ = require('lodash');
var Pact = require('pact');
var User = require(__dirname + '/../../app/models/user').User;
var matchers = Pact.Matchers;

function randomString() {
  return Math.random().toString(36).substring(7);
}

function validPassword() {
  return "G0VUkPay2017Rocks";
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

  validMinimalUser: () => {

    let newUsername = randomUsername();
    let role =  {name: "admin"};

    let data = {
      username: newUsername,
      email: `${newUsername}@example.com`,
      gateway_account_id: String(Math.floor(Math.random() * 10)),
      telephone_number: String(Math.floor(Math.random() * 1000000)),
    };

    return {
      getPactified: () => {
        data.role_name = role.name;
        return pactify(data);
      },
      getAsObject: () => {
        data.role = role;
        return new User(data);
      },
      getPlain: () => {
        data.role_name = role.name;
        return data;
      }
    };
  },

  validUser: (opts = {}) => {

    let newUsername = randomUsername();
    let role =  {name: "admin"};

    let data = {
      username: opts.username || newUsername,
      email: opts.email || `${newUsername}@example.com`,
      gateway_account_id: opts.gateway_account_id || String(Math.floor(Math.random() * 10) + 1),
      telephone_number: opts.telephone_number || String(Math.floor(Math.random() * 1000000)),
      otp_key: opts.otp_key || randomOtpKey(),
      disabled: opts.disabled || false,
      login_counter: opts.login_counter || 0,
      session_version: opts.session_version || 0,
      permissions: opts.permissions || [],
      role: opts.role || {}
    };

    return {
      getPactified: () => {
        data.role_name = role.name;
        return pactify(data);
      },
      getAsObject: () => {
        data.role = role;
        return new User(data);
      },
      getPlain: () => {
        data.role_name = role.name;
        return data;
      }
    };
  },

  validUserResponse: (request) => {

    var data = {
      username: request.username,
      email: request.email || `${request.username}@example.com`,
      password: request.password || "random-password",
      gateway_account_id: request.gateway_account_id || randomAccountId(),
      telephone_number: request.telephone_number || randomTelephoneNumber(),
      otp_key: request.otp_key || "43c3c4t",
      role: {"name": "admin", "description": "Administrator"},
      permissions: request.permissions || ["perm-1", "perm-2", "perm-3"],
      "_links": [{
        "href": `http://adminusers.service/v1/api/users/${request.username}`,
        "rel": "self",
        "method": "GET"
      }]
    };

    return {
      getPactified: () => {
        return pactify(data);
      },
      getAsObject: () => {
        return new User(data);
      },
      getPlain: () => {
        return data;
      }
    };
  },

  invalidUserCreateRequestWithFieldsMissing: () => {
    let request = {
      username: randomUsername(),
      gateway_account_id: '',
      email: '',
      telephone_number: ''
    };

    return withPactified(request);
  },

  invalidUserCreateResponseWhenFieldsMissing: () => {
    let response = {
      errors: ["Field [gateway_account_id] is required", "Field [email] is required", "Field [telephone_number] is required", "Field [role_name] is required"]
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
      op: 'append',
      path: 'sessionVersion',
      value: 1
    };

    return withPactified(request);

  },

  validUpdatePasswordRequest: (token, newPassword) => {
    let request = {
      forgotten_password_code: token || randomString(),
      new_password: newPassword || validPassword()
    };

    return withPactified(request);
  },

  validForgottenPasswordCreateRequest: (username) => {
    let request = {
      username: username || 'username'
    };

    return withPactified(request);
  },

  validForgottenPasswordResponse: (payload) => {
    let request = payload || {};
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
