'use strict'

const chai = require('chai')
const {expect} = require('chai')
const sinon = require('sinon')

const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const controller = require('../../../../app/controllers/direct_debit/gocardless_oauth_controller')
const directDebitClient = require('../../../../app/services/clients/direct_debit_connector_client')

// Global setup
chai.use(chaiAsPromised)
let req, res, stubbedCreateState

describe('GoCardless Controller - redirect to GoCardless website', function () {
  const stateParam = 'some-test-state'
  beforeEach(function () {
    req = {
      account: {
        type: 'test',
        externalId: 'DIRECT_DEBIT:123'
      },
      user: {
        email: 'joe.bog@example.com'
      }
    }

    res = {
      redirect: (url) => {
        expect(url).to.equal(`${process.env.GOCARDLESS_TEST_OAUTH_BASE_URL}/oauth/authorize?client_id=${process.env.GOCARDLESS_TEST_CLIENT_ID}&initial_view=login&redirect_uri=https://selfservice.test.pymnt.uk/oauth/complete&response_type=code&scope=read_write&access_type=offline&state=${stateParam}`)
      },
      status: (code) => {
        expect(code).to.equal(200)
      }
    }

    stubbedCreateState = directDebitClient.partnerApp.createState = sinon.stub()
    stubbedCreateState.resolves({token: stateParam})
  })

  it('successfully redirects to GoCardless', () => {
    controller.index(req, res)
  })
})
