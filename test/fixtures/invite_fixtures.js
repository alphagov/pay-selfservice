let random = require(__dirname + '/../../app/utils/random');
let pactBase = require(__dirname + '/pact_base');
let pactInvites = pactBase();
let _ = require('lodash');

module.exports = {

  validInviteRequest: (opts = {}) => {

    let invitee = "random@example.com";
    let senderId = random.randomUuid();
    let role = {name: "admin"};

    let data = {
      email: opts.email || invitee,
      sender: opts.sender || senderId,
      role_name: opts.role_name || role
    };

    return {
      getPactified: () => {
        return pactInvites.pactify(data);
      },
      getPlain: () => {
        return data;
      }
    };
  },

  validInviteResponse: (opts = {}) => {
    let invitee = "random@example.com";

    let data = {
      email: opts.email || invitee,
    };

    if (opts.telephone_number) {
      data.telephone_number = opts.telephone_number;
    }

    return {
      getPactified: () => {
        return pactInvites.pactify(data);
      },
      getPlain: () => {
        return data;
      }
    };
  },

  invalidInviteRequest: (opts = {}) => {

    let senderId = random.randomUuid();
    let role = {name: "admin"};

    let data = {
      email: opts.email || '',
      sender: opts.sender || senderId,
      role_name: opts.role_name || role
    };

    return {
      getPactified: () => {
        return pactInvites.pactify(data);
      },
      getPlain: () => {
        return data;
      }
    };
  },

  validRegistrationRequest: (opts = {}) => {

    let data = {
      code: opts.code || random.randomUuid(),
      telephone_number: opts.telephone_number || '12345678901',
      password: opts.password || 'password1234'
    };

    return {
      getPactified: () => {
        return pactInvites.pactify(data);
      },
      getPlain: () => {
        return data;
      }
    };
  },

  badRequestResponseWhenFieldsMissing: (missingFields) => {
    let responseData = _.map(missingFields, (field) => {
      return `Field [${field}] is required`;
    });
    let response = {
      errors: responseData
    };

    return pactInvites.withPactified(response);
  },

  invalidInviteCreateResponseWhenFieldsMissing: () => {
    let response = {
      // At the moment to discuss Failfast approach to the API rather than error collection
      errors: ["Field [email] is required"]
    };

    return pactInvites.withPactified(response);
  },

  conflictingInviteResponseWhenEmailUserAlreadyCreated: (email) => {
    let response = {
      errors: ['invite with email [' + email + '] already exists']
    };

    return {
      getPactified: () => {
        return pactInvites.withPactified(response);
      },
      getPlain: () => {
        return response;
      }
    };

  },

  validVerifyOtpCodeRequest: (opts = {}) => {
    let data = {
      code: opts.code || random.randomUuid(),
      otp: opts.otp || '123456'
    };

    return {
      getPactified: () => {
        return pactInvites.pactify(data);
      },
      getPlain: () => {
        return data;
      }
    };
  }

};
