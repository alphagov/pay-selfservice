'use strict'

const chai = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')
const csrf = require('csrf')

const mockSession = require('../../../test-helpers/mock-session.js')
const getApp = require('../../../../server.js').getApp
const userFixtures = require('../../../fixtures/user.fixtures')
const formatAccountPathsFor = require('../../../../app/utils/format-account-paths-for')
const paths = require('../../../../app/paths.js')
const { validGatewayAccountResponse } = require('../../../fixtures/gateway-account.fixtures')
const User = require('../../../../app/models/User.class')

// Constants
const expect = chai.expect
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const connectorMock = nock(process.env.CONNECTOR_URL)
const USER_RESOURCE = '/v1/api/users'
const SERVICES_RESOURCE = '/v1/api/services'
let response, user, $

describe('Toggle billing address collection controller', () => {
  afterEach(() => {
    nock.cleanAll()
  })
  const EXTERNAL_ID_IN_SESSION = 'exsfjpwoi34op23i4'
  const EXTERNAL_SERVICE_ID = 'dsfkbskjalksjdlk342'
  const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'
  const toggleBillingAddressPath = formatAccountPathsFor(paths.account.toggleBillingAddress.index, EXTERNAL_GATEWAY_ACCOUNT_ID)

  const buildUserWithCollectBillingAddress = (collectBillingAddress) => {
    return userFixtures.validUserResponse({
      service_roles: [{
        service: {
          external_id: EXTERNAL_SERVICE_ID,
          collect_billing_address: collectBillingAddress
        }
      }]
    })
  }

  describe('should get index with billing address on', () => {
    before(done => {
      user = buildUserWithCollectBillingAddress(true)
      connectorMock.get(`/v1/api/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
        .reply(200, validGatewayAccountResponse({ external_id: EXTERNAL_GATEWAY_ACCOUNT_ID, gateway_account_id: '666' }))
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user)
      const app = mockSession.getAppWithLoggedInUser(getApp(), new User(user))
      supertest(app)
        .get(toggleBillingAddressPath)
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 200 status code`, () => {
      expect(response.statusCode).to.equal(200)
    })
    it('should have correct checkbox checked', () => {
      expect($('#billing-address-toggle:checked').length).to.equal(1)
      expect($('#billing-address-toggle-2:checked').length).to.equal(0)
    })
  })
  describe('should get index with billing address off', () => {
    before(done => {
      user = buildUserWithCollectBillingAddress(false)
      connectorMock.get(`/v1/api/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
        .reply(200, validGatewayAccountResponse({ external_id: EXTERNAL_GATEWAY_ACCOUNT_ID, gateway_account_id: '666' }))
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user)
      const app = mockSession.getAppWithLoggedInUser(getApp(), new User(user))
      supertest(app)
        .get(toggleBillingAddressPath)
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 200 status code`, () => {
      expect(response.statusCode).to.equal(200)
    })
    it('should have correct checkbox checked', () => {
      expect($('#billing-address-toggle:checked').length).to.equal(0)
      expect($('#billing-address-toggle-2:checked').length).to.equal(1)
    })
  })
  describe('should redirect to index on enable billing address', () => {
    before(done => {
      user = buildUserWithCollectBillingAddress(true)
      connectorMock.get(`/v1/api/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
        .reply(200, validGatewayAccountResponse({ external_id: EXTERNAL_GATEWAY_ACCOUNT_ID, gateway_account_id: '666' }))
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user)
      adminusersMock.patch(`${SERVICES_RESOURCE}/${EXTERNAL_SERVICE_ID}`)
        .reply(200, {
          collect_billing_address: false
        })

      const app = mockSession.getAppWithLoggedInUser(getApp(), new User(user))
      supertest(app)
        .post(toggleBillingAddressPath)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'a-request-id')
        .send({
          'billing-address-toggle': 'on',
          csrfToken: csrf().create('123')
        })
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it('should get a nice 302 status code', () => {
      expect(response.statusCode).to.equal(302)
    })
    it('should redirect to the index page', () => {
      expect(response.headers).to.have.property('location').to.equal(toggleBillingAddressPath)
    })
  })
  describe('should redirect to index on disable billing address', () => {
    before(done => {
      user = buildUserWithCollectBillingAddress(false)
      connectorMock.get(`/v1/api/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
        .reply(200, validGatewayAccountResponse({ external_id: EXTERNAL_GATEWAY_ACCOUNT_ID, gateway_account_id: '666' }))
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user)
      adminusersMock.patch(`${SERVICES_RESOURCE}/${EXTERNAL_SERVICE_ID}`)
        .reply(200, {
          collect_billing_address: false
        })

      const app = mockSession.getAppWithLoggedInUser(getApp(), new User(user))
      supertest(app)
        .post(toggleBillingAddressPath)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'a-request-id')
        .send({
          'billing-address-toggle': 'off',
          csrfToken: csrf().create('123')
        })
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it('should get a nice 302 status code', () => {
      expect(response.statusCode).to.equal(302)
    })
    it('should redirect to the index page', () => {
      expect(response.headers).to.have.property('location').to.equal(toggleBillingAddressPath)
    })
  })
})
