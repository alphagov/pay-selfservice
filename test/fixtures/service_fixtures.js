const _ = require('lodash');
let Pact = require('pact');
let User = require(__dirname + '/../../app/models/user').User;
let matchers = Pact.Matchers;
var userFixtures = require(__dirname + '/user_fixtures');



function randomServiceId() {
  return Math.floor(Math.random() * 1000);
}

function randomString() {
  return Math.random().toString(36).substring(7);
}

function pactifyArray(arr) {
   let pactified =[];
   arr.forEach( (val) => {
      pactified.push(matchers.somethingLike(val));
   });
   return pactified;
}


function pactifyUsersArray(arr) {
  return  matchers.eachLike(pactify(arr[0]),{min:arr.length})
}



function pactify(object) {
  let pactified = {};
  _.forIn(object, (value, key) => {
      if ( ["service_ids","gateway_account_ids"].indexOf(key) != -1) {
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

  /**
   * @param request Params override response
   * @return {{getPactified: (function()) Pact response, getPlain: (function()) request with overrides applied}}
   */
  validServiceUsersResponse: (request) => {

    request['username'] = "existing-user";
    let data = [ request.user || userFixtures.validUserResponse(request).getPlain() ];
    return {
      getPactified: () => {
        return pactifyUsersArray(data);
      },
      getPlain: () => {
        return data;
      }
    };
  },


  getServiceUsersNotFoundResponse: (request) => {
    let response = {
      errors: ["service not found"]
    };

    return withPactified(response);
  }

};
