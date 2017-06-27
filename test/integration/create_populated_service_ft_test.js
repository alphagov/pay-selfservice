'use strict';

const nock = require('nock');
const csrf = require('csrf');
const supertest = require('supertest');
const serviceFixtures = require('../fixtures/service_fixtures');
const userFixtures = require('../fixtures/user_fixtures');
const paths = require(__dirname + '/../../app/paths.js');
const serviceRegistrationService = require('../../app/services/service_registration_service');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const adminusersMock = nock(process.env.ADMINUSERS_URL);
const connectorMock = nock(process.env.CONNECTOR_URL);

chai.use(chaiAsPromised);
const expect = chai.expect;

const CONNECTOR_CREATE_ACCOUNT_URL = '/v1/api/accounts';
const ADMINUSER_CREATE_SERVICE_URL = '/v1/api/services';
const ADMINUSER_CREATE_USER_URL = '/v1/api/users';

describe('Creates a service containing a sandbox gateway account and a user', function () {

  afterEach((done) => {
    nock.cleanAll();
    done();
  });

  it('should create a sandbox gateway account, a service, a user and associate those three', function(done){

    const connectorCreateGatewayAccountResponse = {
      "gateway_account_id": "1",
      "description": null,
      "analytics_id": null,
      "links":[{"href": "https://connector.internal.pymnt.localdomain:9300/v1/api/accounts/1",
        "rel": "self",
        "method": "GET"}],
      "type": "test"};

    const adminUserServiceCreateResponse = serviceFixtures.validCreateServiceResponse();

    const minimalUser = userFixtures.validMinimalUser().getPlain();
    minimalUser.username = minimalUser.email;
    const adminUserCreateUserResponse = userFixtures.validUserResponse(minimalUser).getPlain();

    const createAccountMock = connectorMock.post(CONNECTOR_CREATE_ACCOUNT_URL)
      .reply(201, connectorCreateGatewayAccountResponse);

    const createServiceMock = adminusersMock.post(ADMINUSER_CREATE_SERVICE_URL, {gateway_account_ids: ['1']})
      .reply(201, adminUserServiceCreateResponse);

    const createUserMock = adminusersMock.post(ADMINUSER_CREATE_USER_URL)
      .reply(201, adminUserCreateUserResponse);

    serviceRegistrationService.createPopulatedService({
      email: minimalUser.email,
      phoneNumber: minimalUser.telephone_number,
      role: minimalUser.role
    }, 'bob').should.be.fulfilled.then(user => {
      expect(createUserMock.isDone()).to.be.true;
      expect(createServiceMock.isDone()).to.be.true;
      expect(createAccountMock.isDone()).to.be.true;

      expect(user.email).to.equal(minimalUser.email);
      expect(user.username).to.equal(minimalUser.email);
      expect(user.telephoneNumber).to.equal(minimalUser.telephone_number);

    }).should.notify(done);
  });
});