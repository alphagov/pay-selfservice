require('@test/test-helpers/serialize-mock.js')
const request = require('supertest')
const nock = require('nock')
const assert = require('assert')
const notp = require('notp')
const chai = require('chai')
const _ = require('lodash')
const sinon = require('sinon')
const chaiAsPromised = require('chai-as-promised')

const getApp = require('@root/server').getApp
const { buildGetStripeAccountSetupResponse } = require('@test/fixtures/stripe-account-setup.fixtures')
const gatewayAccountFixtures = require('@test/fixtures/gateway-account.fixtures')
const paths = require('@root/paths')
const mockSession = require('@test/test-helpers/mock-session')
const loginController = require('@controllers/login')
const mockRes = require('@test/fixtures/response')

const { CONNECTOR_URL } = process.env
const { LEDGER_URL } = process.env
chai.use(chaiAsPromised)
const expect = chai.expect

const adminusersMock = nock(process.env.ADMINUSERS_URL)
const ACCOUNT_ID = '182364'
const ACCOUNT_EXTERNAL_ID = 'an-external-id'
const USER_RESOURCE = '/v1/api/users'

const user = mockSession.getUser()
user.serviceRoles[0].service.gatewayAccountIds = [ACCOUNT_ID]

describe('The logged in endpoint', function () {
  it('should render ok when logged in', function (done) {
    const app = mockSession.getAppWithLoggedInUser(getApp(), user)

    nock(CONNECTOR_URL)
      .get(`/v1/frontend/accounts/${ACCOUNT_ID}`)
      .reply(200, gatewayAccountFixtures.validGatewayAccountResponse({
        gateway_account_id: ACCOUNT_ID,
        external_id: ACCOUNT_EXTERNAL_ID
      }))
    nock(CONNECTOR_URL)
      .get(`/v1/api/accounts/${ACCOUNT_ID}/stripe-setup`)
      .reply(200, buildGetStripeAccountSetupResponse({
        bank_account: true,
        responsible_person: true,
        vat_number: true,
        company_number: true
      }))
    nock(LEDGER_URL)
      .get('/v1/report/transactions-summary')
      .query(() => true)
      .reply(200, {
        payments: {
          count: 0,
          gross_amount: 0
        },
        refunds: {
          count: 0,
          gross_amount: 0
        },
        net_income: 0
      })

    request(app)
      .get('/')
      .expect(302)
      .expect('Location', '/my-services')
      .end(done)
  })

  it('should redirect to login if not logged in', function (done) {
    const app = mockSession.getAppWithLoggedOutSession(getApp(), {})
    request(app)
      .get('/')
      .expect(302)
      .expect('Location', '/login')
      .end(done)
  })

  it('should redirect to login if no otp', function (done) {
    const app = mockSession.getAppWithSessionWithoutSecondFactor(getApp(), mockSession.getUser({ gateway_account_ids: [ACCOUNT_ID] }))
    request(app)
      .get('/')
      .expect(302)
      .expect('Location', '/login')
      .end(done)
  })
})

describe('The logout endpoint', function () {
  it('should redirect to login', function (done) {
    const app = mockSession.getAppWithLoggedOutSession(getApp(), {})
    request(app)
      .get('/logout')
      .expect(302)
      .expect('Location', '/login')
      .end(done)
  })

  it('should handle case where mockSession expired', (done) => {
    request(getApp())
      .get('/logout')
      .expect(302)
      .expect('Location', '/login')
      .end(done)
  })
})

describe('The postlogin endpoint', function () {
  it('should redirect to root and clean mockSession of all but passport,currentGatewayAccountId  and last_url', function (done) {
    // happens after the passort middleware, so cant test through supertest
    const user = mockSession.getUser()
    const session = mockSession.getMockSession(user)
    const expectedUrl = paths.user.otpLogIn
    const req = {
      session: _.merge(session, { currentGatewayAccountId: '13' }),
      headers: { 'x-request-id': 'some-unique-id' },
      user
    }
    const res = mockRes.getStubbedRes()

    loginController.postLogin(req, res)
    expect(res.redirect.calledWith(expectedUrl)).to.equal(true)
    expect(req.session).to.deep.equal({
      passport: session.passport,
      last_url: session.last_url,
      currentGatewayAccountId: '13'
    })
    done()
  })
})

describe('The otplogin endpoint', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should render and send key on first time', function (done) {
    const user = mockSession.getUser()

    const sessionData = {
      csrfSecret: '123',
      passport: {
        user
      }
    }

    adminusersMock.post(`${USER_RESOURCE}/${user.externalId}/second-factor`)
      .reply(200)

    const app = mockSession.getAppWithSessionData(getApp(), sessionData)
    request(app)
      .get('/otp-login')
      .expect(200)
      .end(function () {
        assert(sessionData.sentCode === true)
        done()
      })
  })

  it('should render and not send key on second time', function (done) {
    const user = mockSession.getUser()

    const sessionData = {
      csrfSecret: '123',
      passport: {
        user
      },
      sentCode: true
    }

    const app = mockSession.getAppWithSessionData(getApp(), sessionData)

    request(app)
      .get('/otp-login')
      .expect(200)
      .end(function () {
        done()
      })
  })
})

describe('The afterOtpLogin endpoint', function () {
  it('should redirect to login to the last url', function (done) {
    const user = mockSession.getUser()
    const session = mockSession.getMockSession(user)
    const req = {
      session,
      headers: { 'x-request-id': 'some-unique-id' },
      user
    }
    const lastUrl = session.last_url
    const res = mockRes.getStubbedRes()

    loginController.afterOTPLogin(req, res)
    expect(res.redirect.calledWith(lastUrl)).to.equal(true)
    done()
  })

  it('should redirect to root if last url is not defined', function (done) {
    const user = mockSession.getUser()
    user.sessionVersion = 1
    const req = {
      session: mockSession.getMockSession(user),
      headers: { 'x-request-id': 'some-unique-id' },
      user
    }
    const res = mockRes.getStubbedRes()
    delete req.session.last_url
    delete req.session.secondFactor
    req.session.version = 0

    loginController.afterOTPLogin(req, res)
    expect(res.redirect.calledWith('/')).to.equal(true)
    expect(req.session.secondFactor).to.equal('totp')
    expect(req.session.version).to.equal(1)
    done()
  })
})

describe('login get endpoint', function () {
  it('should set the right flash message if both fields are empty', function (done) {
    const req = { body: { username: '', password: '' } }
    const res = mockRes.getStubbedRes()

    testController(loginController.loginUser, req, res)
    expect(req.flash('error') === 'empty_all')

    res.locals = { flash: {} }
    testController(loginController.loginGet, req, res)
    expect(res.locals.flash === { username: 'You must enter a username', password: 'You must enter a password' })
    done()
  })

  it('should set the right flash message if individual fields are empty', function (done) {
    const req = { body: { username: '', password: '123' } }
    const res = mockRes.getStubbedRes()

    testController(loginController.loginUser, req, res)
    expect(req.flash('error') === 'empty_username')

    res.locals = { flash: {} }
    testController(loginController.loginGet, req, res)
    expect(res.locals.flash === { username: 'You must enter a username' })
    done()
  })
})

describe('login post endpoint', function () {
  it('should set the right flash message if both fields are empty', function (done) {
    const req = { body: { username: '', password: '' } }
    const res = mockRes.getStubbedRes()

    testController(loginController.loginUser, req, res)
    expect(req.flash('error') === 'empty_all')
    done()
  })

  it('should set the right flash message if individual fields are empty', function (done) {
    const req = { body: { username: '', password: '123' } }
    const res = mockRes.getStubbedRes()

    testController(loginController.loginUser, req, res)
    expect(req.flash('error') === 'empty_username')
    done()
  })

  it('should redirect to logout if csrf token does not exist for the login post', function (done) {
    request(getApp())
      .post(paths.user.logIn)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({})
      .expect(res => {
        expect(res.status).to.equal(302)
        expect('Location', paths.user.logOut)
      })
      .end(done)
  })
})

describe('otp login post endpoint', function () {
  it('should redirect to logout if csrf token does not exist for the otp login post', function (done) {
    const user = mockSession.getUser()
    const session = mockSession.getMockSession(user)
    delete session.csrfSecret

    const app2 = mockSession.getAppWithSessionData(getApp(), session)

    request(app2)
      .post(paths.user.otpLogIn)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ code: notp.totp.gen('12345') })
      .expect(res => {
        expect(res.status).to.equal(302)
        expect('Location', paths.user.logOut)
      })
      .end(done)
  })
})

describe('otp send again post endpoint', function () {
  it('should redirect to logout if csrf token does not exist for the send again post', function (done) {
    const user = mockSession.getUser()
    const session = mockSession.getMockSession(user)
    delete session.csrfSecret

    const app2 = mockSession.getAppWithSessionData(getApp(), session)

    request(app2)
      .post(paths.user.otpSendAgain)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({})
      .expect(res => {
        expect(res.status).to.equal(302)
        expect('Location', paths.user.logOut)
      })
      .end(done)
  })
})

function testController (controller, req, res) {
  _.assign(req, {
    headers: { 'x-request-id': 'some-unique-id' },
    flash: sinon.stub()
  })
  controller(req, res)
}
