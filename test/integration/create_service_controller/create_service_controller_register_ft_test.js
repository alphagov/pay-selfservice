'use strict';

const nock = require('nock');
const mockSession = require('../../test_helpers/mock_session');
const getApp = require('../../../server').getApp;
const csrf = require('csrf');
const supertest = require('supertest');
const selfRegisterFixtures = require('../../fixtures/self_register_fixtures');
const paths = require('../../../app/paths');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const adminusersMock = nock(process.env.ADMINUSERS_URL);
const SERVICE_INVITE_RESOURCE = '/v1/api/invites/service';

let app;
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('create service otp validation', function () {

  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

  it('should redirect to confirmation page on successful registration', function (done) {
    const validServiceRegistrationRequest = selfRegisterFixtures.validRegisterRequest();

    const request = validServiceRegistrationRequest.getPlain();
    adminusersMock.post(`${SERVICE_INVITE_RESOURCE}`, request)
      .reply(201);

    app = mockSession.getAppWithLoggedOutSession(getApp());
    supertest(app)
      .post('/create-service/register')
      .send({
        email: request.email,
        'telephone-number': request.telephone_number,
        password: request.password,
        csrfToken: csrf().create('123')
      })
      .expect(303)
      .expect('Location', paths.selfCreateService.confirm)
      .end(done);
  });

  it('should redirect to register page if user input invalid', function (done) {
    const invalidServiceRegistrationRequest = selfRegisterFixtures.invalidEmailRegisterRequest();

    const request = invalidServiceRegistrationRequest.getPlain();
    let session = {};
    app = mockSession.getAppWithLoggedOutSession(getApp(), session);
    supertest(app)
      .post('/create-service/register')
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
         email: '',
         telephoneNumber: '07912345678'
        });
      })
      .end(done);
  });
});
