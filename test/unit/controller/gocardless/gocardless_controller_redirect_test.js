'use strict'

const chai = require('chai')
const {expect} = require('chai')

const sinon = require('sinon')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const controller = require('../../../../app/controllers/direct_debit/gocardless_oauth_controller')
const publicAuthClient = require('../../../../app/services/clients/public_auth_client')

// Global setup
chai.use(chaiAsPromised)
let req, res

describe('gocardless client - redirect to GoCardless website', function () {
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
        expect(url).to.equal(`https://connect-sandbox.gocardless.com/oauth/authorize?client_id=${process.env.GOCARDLESS_CLIENT_ID}&initial_view=login&redirect_uri=https%3A%2F%2Fselfservice.test.pymnt.uk%2Foauth%2Fcomplete&response_type=code&scope=read_write&access_type=offline&state=a-csrf-token`)
      }
    }
    let stubbedCreate = publicAuthClient.createTokenForAccount = sinon.stub()
    stubbedCreate.resolves({token: 'a-csrf-token'})
  })

  it('when successfully redirects to GoCardless', () => {
    controller.index(req, res)
  })
})
