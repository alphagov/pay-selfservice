'use strict'

// NPM dependencies
const chai = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')
const csrf = require('csrf')

// Local dependencies
const mockSession = require('../../../test_helpers/mock_session.js')
const getApp = require('../../../../server.js').getApp
const userFixtures = require('../../../fixtures/user_fixtures')
const formattedPathFor = require('../../../../app/utils/replace_params_in_path')
const paths = require('../../../../app/paths.js')

// Constants
const expect = chai.expect
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
    it('should display content when setting is on ', () => {
      expect($('h1').text()).to.contain('You are collecting the billing address')
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
    it('should display content when setting is off', () => {
      expect($('h1').text()).to.contain('You are not collecting the billing address')
    })
  })
  describe('should get warning with billing address off', () => {
    before(done => {
      user = buildUserWithCollectBillingAddress(true)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .post(paths.toggleBillingAddress.confirmOff)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          csrfToken: csrf().create('123')
        })
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it('should get a nice 200 status code', () => {
      expect(response.statusCode).to.equal(200)
    })
    it('should display content when setting is off', () => {
      expect($('h1').text()).to.contain('Are you sure you want to turn off the billing address?')
    })
  })
  describe('should redirect to index on enable billing address', () => {
    before(done => {
      user = buildUserWithCollectBillingAddress(true)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      adminusersMock.patch(`${SERVICES_RESOURCE}/${EXTERNAL_SERVICE_ID}`)
        .reply(200)

      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .post(paths.toggleBillingAddress.on)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'a-request-id')
        .send({
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
        .reply(200)

      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .post(paths.toggleBillingAddress.off)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'a-request-id')
        .send({
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
