'use strict'

const chai = require('chai')
const {expect} = require('chai')
const sinon = require('sinon')

const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const gocardlessRedirect = require('../../../../app/middleware/partnerapp/handle_redirect_to_gocardless_connect')
const directDebitClient = require('../../../../app/services/clients/direct_debit_connector_client')

const REDIRECT_URI = process.env.SELFSERVICE_BASE + '/oauth/complete'
const CLIENT_ID = process.env.GOCARDLESS_TEST_CLIENT_ID
const GOCARDLESS_URL = process.env.GOCARDLESS_TEST_OAUTH_BASE_URL + '/oauth/authorize'

// Global setup
chai.use(chaiAsPromised)
let req, res, stubbedCreateState

describe('Partner app middleware - redirect to GoCardless Connect for OAuth', function () {
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

    stubbedCreateState = directDebitClient.partnerApp.createState = sinon.stub()
    stubbedCreateState.resolves({token: stateParam})
  })

  it('successfully redirects to GoCardless', (done) => {
    const expectedUrl = `${GOCARDLESS_URL}?client_id=${CLIENT_ID}&initial_view=login&redirect_uri=${REDIRECT_URI}&response_type=code&scope=read_write&access_type=offline&state=${stateParam}`
    res = {
      redirect: (url) => {
        expect(url).to.equal(expectedUrl)
      },
      status: (code) => {
        expect(code).to.equal(302)
      }
    }

    gocardlessRedirect.index(req, res)
    done()
  })
})
