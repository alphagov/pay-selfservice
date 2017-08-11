var _ = require('lodash')
var sinon = require('sinon')

function randomString () {
  return Math.random().toString(36).substring(7)
}

function validPassword () {
  return 'G0VUkPay2017Rocks'
}

function randomUsername () {
  var name = randomString()
  var domain = 'example.gov.uk'
  return name + '@' + domain
}

var baseReq = {
  flash: sinon.stub(),
  session: {
    destroy: sinon.stub()
  }
}

module.exports = {
  validForgottenPasswordPost: (username) => {
    let req = {
      body: {
        username: username || randomUsername()
      }
    }

    return _.merge(baseReq, req)
  },

  validForgottenPasswordGet: (token) => {
    let req = {
      params: {
        id: token || randomString()
      }
    }

    return _.merge(baseReq, req)
  },

  validUpdatePasswordPost: (username, token, password) => {
    let req = {
      params: {
        id: token || randomString()
      },
      body: {
        password: password || validPassword(),
        username: username || randomUsername()
      }
    }

    return _.merge(baseReq, req)
  }
}
