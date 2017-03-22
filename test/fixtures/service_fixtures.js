let userFixtures = require(__dirname + '/user_fixtures');
let pactBase     = require(__dirname + '/pact_base');
let pactServices = pactBase({array: ["service_ids", "gateway_account_ids"]});

module.exports = {

  /**
   * @param request Params override response
   * @return {{getPactified: (function()) Pact response, getPlain: (function()) request with overrides applied}}
   */
  validServiceUsersResponse: (request) => {
    request['username'] = "existing-user";
    let data = [request.user || userFixtures.validUserResponse(request).getPlain()];
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
  }
};
