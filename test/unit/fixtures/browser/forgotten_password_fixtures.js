var _ = require('lodash');
var sinon = require('sinon');

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

var baseReq = {
  flash: sinon.stub(),
  session: {
    destroy: sinon.stub()
  }
};

module.exports = {
  validForgottenPasswordPost: (username) => {
    let req = {
      body: {
        username: username || randomUsername()
      }
    };

    return _.merge(baseReq, req);
  },

  validForgottenPasswordGet: (token) => {
    let req = {
      params: {
        id: token || randomString()
      }
    };

    return _.merge(baseReq, req);
  },

  validUpdatePasswordPost: (username, token, password) => {
    let req = {
      params: {
        id: token || randomString()
      },
      body: {
        password: password || randomString(),
        username: username || randomUsername()
      }
    };

    return _.merge(baseReq, req);
  }
};
