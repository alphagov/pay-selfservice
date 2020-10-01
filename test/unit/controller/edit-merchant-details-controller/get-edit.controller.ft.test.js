const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')

const mockSession = require('../../../test-helpers/mock-session.js')
const getApp = require('../../../../server.js').getApp
const supertest = require('supertest')
const userFixtures = require('../../../fixtures/user.fixtures')
const paths = require('../../../../app/paths.js')
const formattedPathFor = require('../../../../app/utils/replace-params-in-path')

const adminusersMock = nock(process.env.ADMINUSERS_URL)
const USER_RESOURCE = '/v1/api/users'
let response, session, $

const EXTERNAL_ID_IN_SESSION = 'exsfjpwoi34op23i4'
const EXTERNAL_SERVICE_ID = 'dsfkbskjalksjdlk342'

const buildUserResponse = (gatewayAccountIds, merchantDetails) => {
  return userFixtures.validUserResponse({
    external_id: EXTERNAL_ID_IN_SESSION,
    service_roles: [{
      service: {
        external_id: EXTERNAL_SERVICE_ID,
        gateway_account_ids: gatewayAccountIds,
        merchant_details: merchantDetails
      }
    }]
  })
}

describe('edit merchant details controller - get', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('when the merchant already has details (CREDIT CARD GATEWAY ACCOUNT)', () => {
    before(done => {
      const user = buildUserResponse(['20'], {
        name: 'name',
        telephone_number: '',
        address_line1: 'line1',
        address_line2: 'line2',
        address_city: 'City',
        address_postcode: 'POSTCODE',
        address_country: 'AR',
        email: ''
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
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
      const user = buildUserResponse(['DIRECT_DEBIT:somerandomidhere'], {
        name: 'name',
        telephone_number: '03069990000',
        address_line1: 'line1',
        address_line2: 'line2',
        address_city: 'City',
        address_postcode: 'POSTCODE',
        address_country: 'AR',
        email: 'dd-merchant@example.com'
      })

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
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
      const user = buildUserResponse(['20'], {
        name: '',
        telephone_number: '',
        address_line1: '',
        address_line2: '',
        address_city: '',
        address_postcode: '',
        address_country: '',
        email: ''
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
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
      expect($('#merchant-name').val()).equal('')
      expect($('#address-line1')).withNoAttribute('value')
      expect($('#address-line2')).withNoAttribute('value')
      expect($('#address-city')).withNoAttribute('value')
      expect($('#address-postcode')).withNoAttribute('value')
      expect($('#address-country').val()).to.equal('GB')
    })
    it(`should display the merchant details`, () => {
      expect($('#merchant-details-info').text()).to.include('Payment card schemes require the details')
    })
  })
  describe('when the merchant has empty details (DIRECT DEBIT GATEWAY ACCOUNT)', () => {
    before(done => {
      const user = buildUserResponse(['DIRECT_DEBIT:somerandomidhere'], {
        name: '',
        telephone_number: '',
        address_line1: '',
        address_line2: '',
        address_city: '',
        address_postcode: '',
        address_country: '',
        email: ''
      })

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
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
      expect($('#merchant-name').val()).equal('')
      expect($('#telephone-number')).withNoAttribute('value')
      expect($('#merchant-email')).withNoAttribute('value')
      expect($('#address-line1')).withNoAttribute('value')
      expect($('#address-line2')).withNoAttribute('value')
      expect($('#address-city')).withNoAttribute('value')
      expect($('#address-postcode')).withNoAttribute('value')
      expect($('#address-country').val()).to.equal('GB')
    })
    it(`should display the merchant details info`, () => {
      expect($('#merchant-details-info').text()).to.include('Direct Debit requires the details')
    })
  })
  describe('when the merchant has empty details (DIRECT DEBIT GATEWAY ACCOUNT and CREDIT CARD GATEWAY ACCOUNT)', () => {
    before(done => {
      const user = buildUserResponse(['DIRECT_DEBIT:somerandomidhere', '12345'], {
        name: '',
        telephone_number: '',
        address_line1: '',
        address_line2: '',
        address_city: '',
        address_postcode: '',
        address_country: '',
        email: ''
      })

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
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
      expect($('#merchant-name').val()).equal('')
      expect($('#telephone-number')).withNoAttribute('value')
      expect($('#merchant-email')).withNoAttribute('value')
      expect($('#address-line1')).withNoAttribute('value')
      expect($('#address-line2')).withNoAttribute('value')
      expect($('#address-city')).withNoAttribute('value')
      expect($('#address-postcode')).withNoAttribute('value')
      expect($('#address-country').val()).to.equal('GB')
    })
    it(`should display the merchant details info`, () => {
      expect($('#merchant-details-info').text()).to.include('Payment card schemes and Direct Debit require the details')
    })
  })
  describe('when errors and merchant details are set in the session (CREDIT CARD GATEWAY ACCOUNT)', () => {
    const merchantNameError = 'merchant name error'
    const addressLine1Error = 'address line 1 error'
    const addressLine2Error = 'address line 2 error'
    const addressCityError = 'address city error'
    const addressPostcodeError = 'address postcode error'
    const addressCountryError = 'address country error'

    before(done => {
      const user = buildUserResponse(['20'])

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      session = {
        csrfSecret: '123',
        12345: { refunded_amount: 5 },
        passport: {
          user: user.getAsObject()
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
              'merchant-name': merchantNameError,
              'address-line1': addressLine1Error,
              'address-line2': addressLine2Error,
              'address-city': addressCityError,
              'address-postcode': addressPostcodeError,
              'address-country': addressCountryError
            }
          }
        }
      }
      const app = mockSession.createAppWithSession(getApp(), session)
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
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
      expect($('.govuk-error-summary__list li').length).to.equal(5)
      expect($('.govuk-error-summary__list li a[href$="#merchant-name"]').text()).to.equal('Name')
      expect($('.govuk-error-summary__list li a[href$="#address-country"]').text()).to.equal('Country')
    })
    it(`should show inline error messages`, () => {
      expect($('.govuk-error-message').length).to.equal(6)
      expect($('.govuk-form-group--error > input#merchant-name').parent().find('.govuk-error-message').text())
        .to.contain(merchantNameError)
      expect($('.govuk-form-group--error > input#address-line1').parent().find('.govuk-error-message').text())
        .to.contain(addressLine1Error)
      expect($('.govuk-form-group--error > input#address-line2').parent().find('.govuk-error-message').text())
        .to.contain(addressLine2Error)
      expect($('.govuk-form-group--error > input#address-city').parent().find('.govuk-error-message').text())
        .to.contain(addressCityError)
      expect($('.govuk-form-group--error > input#address-postcode').parent().find('.govuk-error-message').text())
        .to.contain(addressPostcodeError)
      expect($('.govuk-form-group--error > select#address-country').parent().find('.govuk-error-message').text())
        .to.contain(addressCountryError)
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
    const merchantNameError = 'merchant name error'
    const telephoneNumberError = 'telephone number error'
    const merchantEmailError = 'merchant email error'

    before(done => {
      const user = buildUserResponse(['DIRECT_DEBIT:somerandomidhere'])
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      session = {
        csrfSecret: '123',
        12345: { refunded_amount: 5 },
        passport: {
          user: user.getAsObject()
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
              'merchant-name': merchantNameError,
              'telephone-number': telephoneNumberError,
              'merchant-email': merchantEmailError
            }
          }
        }
      }
      const app = mockSession.createAppWithSession(getApp(), session)
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
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
      expect($('.govuk-error-summary__list li').length).to.equal(3)
      expect($('.govuk-error-summary__list li a[href$="#merchant-name"]').text()).to.equal('Name')
      expect($('.govuk-error-summary__list li a[href$="#telephone-number"]').text()).to.equal('Phone number')
      expect($('.govuk-error-summary__list li a[href$="#merchant-email"]').text()).to.equal('Email')
    })
    it(`should show inline error messages`, () => {
      expect($('.govuk-error-message').length).to.equal(3)
      expect($('.govuk-form-group--error > input#merchant-name').parent().find('.govuk-error-message').text())
        .to.contain(merchantNameError)
      expect($('.govuk-form-group--error > input#telephone-number').parent().find('.govuk-error-message').text())
        .to.contain(telephoneNumberError)
      expect($('.govuk-form-group--error > input#merchant-email').parent().find('.govuk-error-message').text())
        .to.contain(merchantEmailError)
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
