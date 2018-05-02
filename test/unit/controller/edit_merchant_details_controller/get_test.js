const chai = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const mockSession = require('../../../test_helpers/mock_session.js')
const getApp = require('../../../../server.js').getApp
const supertest = require('supertest')
const userFixtures = require('../../../fixtures/user_fixtures')
const paths = require('../../../../app/paths.js')
const formattedPathFor = require('../../../../app/utils/replace_params_in_path')
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
  describe('when the merchant already has details (CREDIT CARD GATEWAY ACCOUNT)', () => {
    before(done => {
      let serviceRoles = [{
        service: {
          name: 'System Generated',
          external_id: EXTERNAL_SERVICE_ID,
          gateway_account_ids: ['20'],
          merchant_details: {
            name: 'name',
            telephone_number: '',
            address_line1: 'line1',
            address_line2: 'line2',
            address_city: 'City',
            address_postcode: 'POSTCODE',
            address_country: 'AR',
            email: ''
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
      const app = mockSession.getAppWithLoggedInUser(getApp(), userInSession)
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
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
  describe('when the merchant already has details (DIRECT DEBIT GATEWAY ACCOUNT)', () => {
    before(done => {
      let serviceRoles = [{
        service: {
          name: 'System Generated',
          external_id: EXTERNAL_SERVICE_ID,
          gateway_account_ids: ['DIRECT_DEBIT:somerandomidhere'],
          merchant_details: {
            name: 'name',
            telephone_number: '03069990000',
            address_line1: 'line1',
            address_line2: 'line2',
            address_city: 'City',
            address_postcode: 'POSTCODE',
            address_country: 'AR',
            email: 'dd-merchant@example.com'
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
      const app = mockSession.getAppWithLoggedInUser(getApp(), userInSession)
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
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
      expect($('#telephone-number').val()).to.equal('03069990000')
      expect($('#merchant-email').val()).to.equal('dd-merchant@example.com')
      expect($('#address-line1').val()).to.equal('line1')
      expect($('#address-line2').val()).to.equal('line2')
      expect($('#address-city').val()).to.equal('City')
      expect($('#address-postcode').val()).to.equal('POSTCODE')
      expect($('#address-country').val()).to.equal('AR')
    })
  })
  describe('when the merchant has empty details (CREDIT CARD GATEWAY ACCOUNT)', () => {
    before(done => {
      let serviceRoles = [{
        service: {
          name: 'System Generated',
          external_id: EXTERNAL_SERVICE_ID,
          gateway_account_ids: ['20'],
          merchant_details: {
            name: '',
            telephone_number: '',
            address_line1: '',
            address_line2: '',
            address_city: '',
            address_postcode: '',
            address_country: '',
            email: ''
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
      const app = mockSession.getAppWithLoggedInUser(getApp(), userInSession)
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
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
  describe('when the merchant has empty details (DIRECT DEBIT GATEWAY ACCOUNT)', () => {
    before(done => {
      let serviceRoles = [{
        service: {
          name: 'System Generated',
          external_id: EXTERNAL_SERVICE_ID,
          gateway_account_ids: ['DIRECT_DEBIT:somerandomidhere'],
          merchant_details: {
            name: '',
            telephone_number: '',
            address_line1: '',
            address_line2: '',
            address_city: '',
            address_postcode: '',
            address_country: '',
            email: ''
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
      const app = mockSession.getAppWithLoggedInUser(getApp(), userInSession)
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
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
      expect($('#telephone-number').val()).to.equal('')
      expect($('#merchant-email').val()).to.equal('')
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
      const app = mockSession.createAppWithSession(getApp(), session)
      supertest(app)
      .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
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
  describe('when errors and merchant details are set in the session (CREDIT CARD GATEWAY ACCOUNT)', () => {
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
            merchant_details: {
              name: 'name',
              address_line1: 'line1',
              address_line2: 'line2',
              address_city: 'City',
              address_postcode: 'POSTCODE',
              address_country: 'GB'
            },
            errors: {
              'merchant-name': true,
              'address-country': true
            }
          }
        }
      }
      const app = mockSession.createAppWithSession(getApp(), session)
      supertest(app)
      .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
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
    it(`should show prefilled inputs`, () => {
      expect($('#merchant-name').val()).to.equal('name')
      expect($('#address-line1').val()).to.equal('line1')
      expect($('#address-line2').val()).to.equal('line2')
      expect($('#address-city').val()).to.equal('City')
      expect($('#address-postcode').val()).to.equal('POSTCODE')
      expect($('#address-country').val()).to.equal('GB')
    })
  })
  describe('when errors and merchant details are set in the session (DIRECT DEBIT GATEWAY ACCOUNT)', () => {
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
            merchant_details: {
              name: 'name',
              telephone_number: 'invalid-phone',
              address_line1: 'line1',
              address_line2: 'line2',
              address_city: 'City',
              address_postcode: 'POSTCODE',
              address_country: 'GB',
              email: 'dd-merchant@example.com-invalid'
            },
            has_direct_debit_gateway_account: true,
            errors: {
              'merchant-name': true,
              'telephone-number': true,
              'merchant-email': true,
              'address-country': true
            }
          }
        }
      }
      const app = mockSession.createAppWithSession(getApp(), session)
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
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
      expect($('.error-summary-list li').length).to.equal(4)
      expect($('.error-summary-list li a[href$="#merchant-name"]').text()).to.equal('Name')
      expect($('.error-summary-list li a[href$="#telephone-number"]').text()).to.equal('Phone number')
      expect($('.error-summary-list li a[href$="#merchant-email"]').text()).to.equal('Email')
      expect($('.error-summary-list li a[href$="#address-country"]').text()).to.equal('Country')
    })
    it(`should show inline error messages`, () => {
      expect($('.error-message').length).to.equal(4)
      expect($('.error-message').eq(0).text()).to.contain('Please enter a valid name')
      expect($('.error-message').eq(1).text()).to.contain('Please enter a valid phone number')
      expect($('.error-message').eq(2).text()).to.contain('Please enter a valid email')
      expect($('.error-message').eq(3).text()).to.contain('Please enter a valid country')
    })
    it(`should not show an updated successful banner`, () => {
      expect($('.notification').length).to.equal(0)
    })
    it(`should show prefilled inputs`, () => {
      expect($('#merchant-name').val()).to.equal('name')
      expect($('#telephone-number').val()).to.equal('invalid-phone')
      expect($('#merchant-email').val()).to.equal('dd-merchant@example.com-invalid')
      expect($('#address-line1').val()).to.equal('line1')
      expect($('#address-line2').val()).to.equal('line2')
      expect($('#address-city').val()).to.equal('City')
      expect($('#address-postcode').val()).to.equal('POSTCODE')
      expect($('#address-country').val()).to.equal('GB')
    })
  })
})
