let User      = require(__dirname + '/../../app/models/user').User;
let pactBase  = require(__dirname + '/pact_base');
let pactUsers = pactBase({array: ["permissions", "gateway_account_ids", "service_ids"]});
let random    = require(__dirname + '/../../app/utils/random');

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
  return String(Math.floor(Math.random() * 100000) + 1)
}

function randomAccountId() {
  return String(Math.floor(Math.random() * 1000) + 1);
}

function randomServiceId() {
  return String(Math.floor(Math.random() * 1000) + 1);
}

function randomTelephoneNumber() {
  return String(Math.floor(Math.random() * 1000000) + 1);
}

module.exports = {

  validMinimalUser: () => {
    let newExternalId = random.randomUuid();
    let newUsername = randomUsername();
    let role = {name: "admin"};
    let defaultServiceId = randomServiceId();

    let data = {
      external_id: newExternalId,
      username: newUsername,
      email: `${newUsername}@example.com`,
      gateway_account_ids: [randomAccountId()],
      service_ids: [defaultServiceId],
      services: [{name: 'System Generated', id: defaultServiceId}],
      telephone_number: randomTelephoneNumber()
    };

    return {
      getPactified: () => {
        data.role_name = role.name;
        return pactUsers.pactify(data);
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
    let newExternalId = random.randomUuid();
    let newUsername = randomUsername();
    let role = {name: "admin"};
    let defaultServiceId = randomServiceId();

    let data = {
      external_id: opts.external_id || newExternalId,
      username: opts.username || newUsername,
      email: opts.email || `${newUsername}@example.com`,
      gateway_account_ids: opts.gateway_account_ids || [randomAccountId()],
      service_ids: opts.service_ids || [defaultServiceId],
      services: opts.services || [{name: 'System Generated', id: defaultServiceId}],
      telephone_number: opts.telephone_number || String(Math.floor(Math.random() * 1000000)),
      otp_key: opts.otp_key || randomOtpKey(),
      disabled: opts.disabled || false,
      login_counter: opts.login_counter || 0,
      session_version: opts.session_version || 0,
      permissions: opts.permissions || ["perm-1"],
      role: opts.role || {}
    };

    return {
      getPactified: () => {
        data.role_name = role.name;
        return pactUsers.pactify(data);
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
    let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3';
    let req_external_id =  request.external_id || existingExternalId;
    let req_username = request.username || 'existing-user';
    let defaultServiceId = randomServiceId();

    let data = {
      external_id: req_external_id,
      username: req_username,
      email: request.email || `${req_username}@example.com`,
      gateway_account_ids: request.gateway_account_ids || [randomAccountId()],
      service_ids: request.service_ids || [defaultServiceId],
      services: request.services || [{name: 'System Generated', id: defaultServiceId}],
      otp_key: request.otp_key || "43c3c4t",
      role: request.role || {"name": "admin", "description": "Administrator"},
      telephone_number: request.telephone_number || "0123441",
      permissions: request.permissions || ["perm-1", "perm-2", "perm-3"],
      "_links": [{
        "href": `http://adminusers.service/v1/api/users/${req_external_id}`,
        "rel": "self",
        "method": "GET"
      }]
    };

    return {
      getPactified: () => {
        return pactUsers.pactify(data);
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

    return pactUsers.withPactified(request);
  },

  invalidUserCreateResponseWhenFieldsMissing: () => {
    let response = {
      // At the moment to discuss Failfast approach to the API rather than error collection
      errors: ["Field [email] is required", "Field [telephone_number] is required", "Field [role_name] is required"]
    };

    return pactUsers.withPactified(response);
  },

  validAuthenticateRequest: (options) => {
    let request = {
      username: options.username || 'username',
      password: options.password || 'password'
    };

    return pactUsers.withPactified(request);
  },

  unauthorizedUserResponse: () => {
    let response = {
      errors: ["invalid username and/or password"]
    };

    return pactUsers.withPactified(response);
  },

  badAuthenticateResponse: () => {
    let response = {
      errors: ["Field [username] is required", "Field [password] is required"]
    };

    return pactUsers.withPactified(response);
  },

  validIncrementSessionVersionRequest: () => {
    let request = {
      op: 'append',
      path: 'sessionVersion',
      value: 1
    };

    return pactUsers.withPactified(request);
  },

  validAuthenticateSecondFactorRequest: (code) => {
    let request = {
      code: code || '123456'
    };

    return pactUsers.withPactified(request);
  },

  validUpdatePasswordRequest: (token, newPassword) => {
    let request = {
      forgotten_password_code: token || randomString(),
      new_password: newPassword || validPassword()
    };

    return pactUsers.withPactified(request);
  },

  validUpdateServiceRoleRequest: (role) => {
    let request = {
      role_name: role || 'admin'
    };

    return pactUsers.withPactified(request);
  },

  validForgottenPasswordCreateRequest: (username) => {
    let request = {
      username: username || 'username'
    };

    return pactUsers.withPactified(request);
  },

  validForgottenPasswordResponse: (payload) => {
    let request = payload || {};
    let code = randomString();
    let response = {
      user_external_id: request.userExternalId || "userExternalId",
      code: request.code || code,
      date: '2010-12-31T22:59:59.132Z',
      "_links": [{
        "href": `http://localhost:8080/v1/api/forgotten-passwords/${code}`,
        "rel": "self",
        "method": "GET"
      }]
    };

    return pactUsers.withPactified(response);
  },

  badForgottenPasswordResponse: () => {
    let response = {
      errors: ["Field [username] is required"]
    };

    return pactUsers.withPactified(response);
  }

};
