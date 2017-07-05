const random = require(__dirname + '/../../app/utils/random');
const pactBase = require(__dirname + '/pact_base');
const pactInvites = pactBase();
const _ = require('lodash');

module.exports = {

  validInviteRequest: (opts = {}) => {

    const invitee = "random@example.com";
    const senderId = random.randomUuid();
    const role = {name: "admin"};

    const data = {
      service_external_id: opts.externalServiceId || random.randomUuid(),
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
    const invitee = "random@example.com";
    const type = 'user';

    const data = {
      email: opts.email || invitee,
      type: opts.type || type
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

    const senderId = random.randomUuid();
    const role = {name: "admin"};

    const data = {
      service_external_id: opts.externalServiceId,
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

  notPermittedInviteResponse: (userName, serviceId) => {
    const response = {
      errors: ["user [" + userName + "] not authorised to perform operation [invite] in service [" + serviceId + "]"]
    };

    return pactInvites.withPactified(response);
  },

  validRegistrationRequest: (opts = {}) => {

    const data = {
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
    const responseData = _.map(missingFields, (field) => {
      return `Field [${field}] is required`;
    });
    const response = {
      errors: responseData
    };

    return pactInvites.withPactified(response);
  },

  invalidInviteCreateResponseWhenFieldsMissing: () => {
    const response = {
      // At the moment to discuss Failfast approach to the API rather than error collection
      errors: ["Field [email] is required"]
    };

    return pactInvites.withPactified(response);
  },

  conflictingInviteResponseWhenEmailUserAlreadyCreated: (email) => {
    const response = {
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
    const data = {
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
  },

  validResendOtpCodeRequest: (opts = {}) => {
    const data = {
      code: opts.code || random.randomUuid(),
      telephone_number: opts.telephone_number || '01234567891'
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
