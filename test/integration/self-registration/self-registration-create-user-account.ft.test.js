'use strict'

const nock = require('nock')
const csrf = require('csrf')
const supertest = require('supertest')
const chai = require('chai')
const cheerio = require('cheerio')

const mockSession = require('../../test-helpers/mock-session')
const getApp = require('../../../server').getApp
const selfRegisterFixtures = require('../../fixtures/self-register.fixtures')
const paths = require('../../../app/paths')

const SERVICE_INVITE_RESOURCE = '/v1/api/invites/service'
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const expect = chai.expect

let app

describe('create service otp validation', function () {
  afterEach((done) => {
    nock.cleanAll()
    app = null
    done()
  })

  it('should render with errors when they are in recovered object in cookie', function (done) {
    const errorMessage = 'An error with the email'
    const session = {
      pageData: {
        submitRegistration: {
          recovered: {
            telephoneNumber: '07451234567',
            email: 'bob@bob.com',
            errors: {
              email: errorMessage
            }
          }
        }
      }
    }
    app = mockSession.getAppWithLoggedOutSession(getApp(), session)
    supertest(app)
      .get(paths.selfCreateService.register)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.govuk-error-summary__list li').length).to.equal(1)
        expect($('.govuk-error-summary__list li a[href$="#email"]').text()).to.equal(errorMessage)

        expect(session).to.not.have.property('recovered')
      })
      .end(done)
  })

  it('should redirect to confirmation page on successful registration', function (done) {
    const request = selfRegisterFixtures.validRegisterRequest()
    adminusersMock.post(`${SERVICE_INVITE_RESOURCE}`, request)
      .reply(201)

    app = mockSession.getAppWithLoggedOutSession(getApp())
    supertest(app)
      .post(paths.selfCreateService.register)
      .send({
        email: request.email,
        'telephone-number': request.telephone_number,
        password: request.password,
        csrfToken: csrf().create('123')
      })
      .expect(303)
      .expect('Location', paths.selfCreateService.confirm)
      .end(done)
  })

  it('should redirect to register page if user input invalid', function (done) {
    const request = selfRegisterFixtures.invalidEmailRegisterRequest()

    const session = {}
    app = mockSession.getAppWithLoggedOutSession(getApp(), session)
    supertest(app)
      .post(paths.selfCreateService.register)
      .send({
        email: request.email,
        'telephone-number': request.telephone_number,
        password: request.password,
        csrfToken: csrf().create('123')
      })
      .expect(303)
      .expect('Location', paths.selfCreateService.register)
      .expect(() => {
        expect(session.pageData.submitRegistration).to.deep.equal({
          recovered: {
            email: '',
            telephoneNumber: '07912345678',
            errors: {
              email: 'Enter an email address'
            }
          }
        })
      })
      .end(done)
  })
})
