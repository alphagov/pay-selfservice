const _ = require('lodash');
let Pact = require('pact');
let User = require(__dirname + '/../../app/models/user').User;
let matchers = Pact.Matchers;

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
  return String(Math.floor(Math.random() * 1000));
}

function randomTelephoneNumber() {
  return String(Math.floor(Math.random() * 1000000));
}

function pactifyArray(arr) {
   let pactified =[];
   arr.forEach( (val) => {
      pactified.push(matchers.somethingLike(val));
   });
   return pactified;
}

function pactify(object) {
  let pactified = {};
  _.forIn(object, (value, key) => {
      if ( ["permissions","gateway_account_ids"].indexOf(key) != -1) {
         pactified[key] = matchers.eachLike(matchers.somethingLike(value[0]),{min:value.length})
      } else if(value.constructor === Array) {
        pactified[key] = pactifyArray( value );
      } else if (value.constructor === Object)  {
        pactified[key] = pactify(value);
      } else {
        pactified[key] = matchers.somethingLike(value);
      }
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
      gateway_account_ids: [randomAccountId()],
      telephone_number: randomTelephoneNumber()
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
      gateway_account_ids: opts.gateway_account_ids || [String(Math.floor(Math.random() * 10) + 1)],
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

  /**
   * @param request Params override response
   * @return {{getPactified: (function()) Pact response, getAsObject: (function()) User, getPlain: (function()) request with overrides applied}}
   */
  validUserResponse: (request) => {

    var data = {
      username: request.username,
      email: request.email || `${request.username}@example.com`,
      gateway_account_ids: request.gateway_account_ids || [randomAccountId()],
      otp_key: request.otp_key || "43c3c4t",
      role: {"name": "admin", "description": "Administrator"},
      telephone_number: request.telephone_number || "0123441",
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
      gateway_account_ids: [''],
      email: '',
      telephone_number: ''
    };

    return withPactified(request);
  },

  invalidUserCreateResponseWhenFieldsMissing: () => {
    let response = {
      // At the moment to discuss Failfast approach to the API rather than error collection
      errors: ["Field [email] is required", "Field [telephone_number] is required", "Field [role_name] is required"]
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

  validVerifySecondFactorRequest: (code) => {
    let request = {
      code: code || '123456'
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
