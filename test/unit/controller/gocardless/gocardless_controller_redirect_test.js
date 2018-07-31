'use strict'

const chai = require('chai')
const {expect} = require('chai')

const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const controller = require('../../../../app/controllers/direct_debit/gocardless_oauth_controller')

// Global setup
chai.use(chaiAsPromised)
let req, res

describe('GoCardless Controller - redirect to GoCardless website', function () {
  beforeEach(function () {
    req = {}
    req.gateway_account = {
      currentGatewayAccountId: '123'
    }
    req.user = {
      email: 'joe.bog@example.com'
    }
    res = {
      redirect: (url) => {
        expect(url).to.equal(`https://connect-sandbox.gocardless.com/oauth/authorize?client_id=${process.env.GOCARDLESS_CLIENT_ID}&initial_view=login&redirect_uri=https%3A%2F%2Fselfservice.test.pymnt.uk%2Foauth%2Fcomplete&response_type=code&scope=read_write&access_type=offline&state=a-csrf-token.123`)
      }
    }
  })

  it('successfully redirects to GoCardless', () => {
    controller.index(req, res)
  })
})
