const chai = require('chai')
const cheerio = require('cheerio')
const path = require('path')
const nock = require('nock')
const mockSession = require(path.join(__dirname, '/../../../test_helpers/mock_session.js'))
const getApp = require(path.join(__dirname, '/../../../../server.js')).getApp
const supertest = require('supertest')
const userFixtures = require(path.join(__dirname, '/../../../fixtures/user_fixtures'))
const paths = require(path.join(__dirname, '/../../../../app/paths.js'))
const expect = chai.expect
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const USER_RESOURCE = '/v1/api/users'
let response, user, session, $

describe('edit merchant details controller - get', () => {
  afterEach(() => {
    nock.cleanAll()
  })
  const EXTERNAL_ID_IN_SESSION = 'exsfjpwoi34op23i4'
  const EXTERNAL_SERVICE_ID = 'dsfkbskjalksjdlk342'
  let serviceRoles = [{
    service: {
      name: 'System Generated',
      external_id: EXTERNAL_SERVICE_ID,
      gateway_account_ids: ['20']
    },
    role: {
      name: 'admin',
      description: 'Administrator',
      permissions: [{name: 'merchant-details:read'}, {name: 'merchant-details:update'}]
    }
  }]
  let userInSession = mockSession.getUser({
    external_id: EXTERNAL_ID_IN_SESSION,
    service_roles: serviceRoles
  })
  describe('when the merchant already has details', () => {
    before(done => {
      let serviceRoles = [{
        service: {
          name: 'System Generated',
          external_id: EXTERNAL_SERVICE_ID,
          gateway_account_ids: ['20'],
          merchant_details: {
            name: 'name',
            address_line1: 'line1',
            address_line2: 'line2',
            address_city: 'City',
            address_postcode: 'POSTCODE',
            address_country: 'AR'
          }
        },
        role: {
          name: 'admin',
          description: 'Administrator',
          permissions: [{name: 'merchant-details:read'}, {name: 'merchant-details:update'}]
        }
      }]
      let userInSession = mockSession.getUser({
        external_id: EXTERNAL_ID_IN_SESSION,
        service_roles: serviceRoles
      })
      user = userFixtures.validUserWithMerchantDetails(userInSession)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      let app = mockSession.getAppWithLoggedInUser(getApp(), userInSession)
      supertest(app)
        .get(paths.merchantDetails.index)
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 200 status code`, () => {
      expect(response.statusCode).to.equal(200)
    })
    it(`should pre-fill form values with the merchant details`, () => {
      expect($('#merchant-name').val()).to.equal('name')
      expect($('#address-line1').val()).to.equal('line1')
      expect($('#address-line2').val()).to.equal('line2')
      expect($('#address-city').val()).to.equal('City')
      expect($('#address-postcode').val()).to.equal('POSTCODE')
      expect($('#address-country').val()).to.equal('AR')
    })
  })
  describe('when the merchant has empty details', () => {
    before(done => {
      user = userFixtures.validUserWithMerchantDetails(userInSession)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      let app = mockSession.getAppWithLoggedInUser(getApp(), userInSession)
      supertest(app)
        .get(paths.merchantDetails.index)
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 200 status code`, () => {
      expect(response.statusCode).to.equal(200)
    })
    it(`should show empty inputs and GB selected as country`, () => {
      expect($('#merchant-name').val()).to.equal('')
      expect($('#address-line1').val()).to.equal('')
      expect($('#address-line2').val()).to.equal('')
      expect($('#address-city').val()).to.equal('')
      expect($('#address-postcode').val()).to.equal('')
      expect($('#address-country').val()).to.equal('GB')
    })
  })
  describe('when success is set in the session', () => {
    before(done => {
      user = userFixtures.validUserWithMerchantDetails(userInSession)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
      .reply(200, user.getPlain())
      session = {
        csrfSecret: '123',
        12345: {refunded_amount: 5},
        passport: {
          user: userInSession
        },
        secondFactor: 'totp',
        last_url: 'last_url',
        version: 0,
        pageData: {
          editMerchantDetails: {
            success: true
          }
        }
      }
      let app = mockSession.createAppWithSession(getApp(), session)
      supertest(app)
      .get(paths.merchantDetails.index)
      .end((err, res) => {
        response = res
        $ = cheerio.load(res.text || '')
        done(err)
      })
    })
    it(`should get a nice 200 status code`, () => {
      expect(response.statusCode).to.equal(200)
    })
    it(`should show an updated successful banner`, () => {
      expect($('.notification').text()).to.contain('Merchant details updated')
    })
    it(`should not show any error`, () => {
      expect($('.error-summary').length).to.equal(0)
    })
  })
  describe('when errors are set in the session', () => {
    before(done => {
      user = userFixtures.validUserWithMerchantDetails(userInSession)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
      .reply(200, user.getPlain())
      session = {
        csrfSecret: '123',
        12345: {refunded_amount: 5},
        passport: {
          user: userInSession
        },
        secondFactor: 'totp',
        last_url: 'last_url',
        version: 0,
        pageData: {
          editMerchantDetails: {
            success: false,
            errors: {
              'merchant-name': true,
              'address-country': true
            }
          }
        }
      }
      let app = mockSession.createAppWithSession(getApp(), session)
      supertest(app)
      .get(paths.merchantDetails.index)
      .end((err, res) => {
        response = res
        $ = cheerio.load(res.text || '')
        done(err)
      })
    })
    it(`should get a nice 200 status code`, () => {
      expect(response.statusCode).to.be.equal(200)
    })
    it(`should show a list of errors`, () => {
      expect($('.error-summary-list li').length).to.equal(2)
      expect($('.error-summary-list li a[href$="#merchant-name"]').text()).to.equal('Name')
      expect($('.error-summary-list li a[href$="#address-country"]').text()).to.equal('Country')
    })
    it(`should show inline error messages`, () => {
      expect($('.error-message').length).to.equal(2)
      expect($('.error-message').eq(0).text()).to.contain('Please enter a valid name')
      expect($('.error-message').eq(1).text()).to.contain('Please enter a valid country')
    })
    it(`should not show an updated successful banner`, () => {
      expect($('.notification').length).to.equal(0)
    })
  })
})
