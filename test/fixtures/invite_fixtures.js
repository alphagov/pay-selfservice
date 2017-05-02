let random = require(__dirname + '/../../app/utils/random');
let pactBase = require(__dirname + '/pact_base');
let pactInvites = pactBase();

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

  validInviteResponse: opts => {
    let invitee = "random@example.com";

    let data = {
      email: opts.email || invitee
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

    return pactInvites.withPactified(response);
  }

};
