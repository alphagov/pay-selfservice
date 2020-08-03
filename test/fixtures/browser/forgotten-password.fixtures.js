var _ = require('lodash')
var sinon = require('sinon')

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
        username: username || 'validForgottenPasswordPost@example.gov.uk'
      }
    }

    return _.merge(baseReq, req)
  },

  validForgottenPasswordGet: (token) => {
    let req = {
      params: {
        id: token || '3lodzl'
      }
    }

    return _.merge(baseReq, req)
  },

  validUpdatePasswordPost: (username, token, password) => {
    let req = {
      params: {
        id: token || 'dxad2j'
      },
      body: {
        password: password || 'G0VUkPay2017Rocks',
        username: username || 'validUpdatePasswordPost@example.gov.uk'
      }
    }

    return _.merge(baseReq, req)
  }
}
