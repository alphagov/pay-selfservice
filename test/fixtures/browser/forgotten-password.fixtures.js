'use strict'

const sinon = require('sinon')

module.exports = {
  validForgottenPasswordPost: (username) => {
    return {
      body: {
        username: username || 'validForgottenPasswordPost@example.gov.uk'
      },
      flash: sinon.spy(),
      session: {
        destroy: sinon.spy()
      }
    }
  },

  validForgottenPasswordGet: (token) => {
    return {
      params: {
        id: token || '3lodzl'
      },
      flash: sinon.spy(),
      session: {
        destroy: sinon.spy()
      }
    }
  },

  validUpdatePasswordPost: (username, token, password) => {
    return {
      params: {
        id: token || 'dxad2j'
      },
      body: {
        password: password || 'G0VUkPay2017Rocks',
        username: username || 'validUpdatePasswordPost@example.gov.uk'
      },
      flash: sinon.spy(),
      session: {
        destroy: sinon.spy()
      }
    }
  }
}
