'use strict'

const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')
const csrf = require('csrf')

const mockSession = require('../../../test-helpers/mock-session.js')
const getApp = require('../../../../server.js').getApp
const userFixtures = require('../../../fixtures/user.fixtures')
const formattedPathFor = require('../../../../app/utils/replace-params-in-path')
const paths = require('../../../../app/paths.js')

// Constants
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const USER_RESOURCE = '/v1/api/users'
const SERVICES_RESOURCE = '/v1/api/services'
let response, user, $

describe('Toggle billing address collection controller', () => {
  afterEach(() => {
    nock.cleanAll()
  })
  const EXTERNAL_ID_IN_SESSION = 'exsfjpwoi34op23i4'
  const EXTERNAL_SERVICE_ID = 'dsfkbskjalksjdlk342'

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
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.toggleBillingAddress.index, EXTERNAL_SERVICE_ID))
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
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.toggleBillingAddress.index, EXTERNAL_SERVICE_ID))
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
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      adminusersMock.patch(`${SERVICES_RESOURCE}/${EXTERNAL_SERVICE_ID}`)
        .reply(200, {
          collect_billing_address: false
        })

      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .post(paths.toggleBillingAddress.index)
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
      expect(response.headers).to.have.property('location').to.equal(paths.toggleBillingAddress.index)
    })
  })
  describe('should redirect to index on disable billing address', () => {
    before(done => {
      user = buildUserWithCollectBillingAddress(false)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      adminusersMock.patch(`${SERVICES_RESOURCE}/${EXTERNAL_SERVICE_ID}`)
        .reply(200, {
          collect_billing_address: false
        })

      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .post(paths.toggleBillingAddress.index)
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
      expect(response.headers).to.have.property('location').to.equal(paths.toggleBillingAddress.index)
    })
  })
})
