let userFixtures = require(__dirname + '/user_fixtures');
let pactBase     = require(__dirname + '/pact_base');
let pactServices = pactBase({array: ["service_ids", "gateway_account_ids"]});

module.exports = {

  /**
   * @param users Array params override get users response
   * @return {{getPactified: (function()) Pact response, getPlain: (function()) request with overrides applied}}
   */
  validServiceUsersResponse: (users) => {
    let data = [];
    for (let user of users) {
      data.push(userFixtures.validUserResponse(user).getPlain());
    }
    return {
      getPactified: () => {
        return pactServices.pactifyNestedArray(data);
      },
      getPlain: () => {
        return data;
      }
    };
  },

  getServiceUsersNotFoundResponse: () => {
    let response = {
      errors: ["service not found"]
    };
    return pactServices.withPactified(response);
  },

  validCreateServiceRequest: (opts) => {
    opts = opts || {};
    const accountIds = opts.accountIds || ['2'];

    const data = {
      gateway_account_ids: accountIds
    };

    return {
      getPactified: () => {
        return pactServices.pactify(data);
      },
      getPlain: () => {
        return data;
      }
    };
  },

  validCreateServiceResponse: (opts) => {
    opts = opts || {};
    const externalId = opts.externalId || 'externalId';
    const serviceName = opts.serviceName || 'serviceName';

    const data = {
      external_id: externalId,
      name: serviceName
    };

    return {
      getPactified: () => {
        return pactServices.pactify(data);
      },
      getPlain: () => {
        return data;
      }
    };
  }
};
