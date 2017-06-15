let Pact = require('pact');
let helpersPath = __dirname + '/../../test_helpers/';
let pactProxy = require(helpersPath + '/pact_proxy.js');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
let PactInteractionBuilder = require(__dirname + '/../../fixtures/pact_interaction_builder').PactInteractionBuilder;
const {somethingLike: like} = Pact.Matchers;

chai.use(chaiAsPromised);

const expect = chai.expect;
const SERVICES_PATH = '/v1/api/services';
let mockPort = Math.floor(Math.random() * 65535);
let mockServer = pactProxy.create('localhost', mockPort);

let adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client - delete user', function () {

  let adminUsersMock;
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-delete-user', provider: 'adminusers', port: mockPort});
      done();
    });
  });

  /**
   * Remove the server and publish pacts to broker
   */
  after(function (done) {
    mockServer.delete()
      .then(() => pactProxy.removeAll())
      .then(() => done());
  });

  describe('delete user API', function () {

    let service_id = "pact-delete-service-id";
    let remover_id = "pact-delete-remover-id";
    let user_id = "pact-delete-user-id";

    context('delete user API - success', () => {

      const removerBodyExpectation = {
        'remover_id': like(remover_id)
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${service_id}/users/${user_id}`)
            .withState('a user and user admin exists in service with the given ids before a delete operation')
            .withUponReceiving('a valid delete user from service request')
            .withMethod('DELETE')
            .withRequestBody(removerBodyExpectation)
            .withResponseHeaders({})
            .withStatusCode(204)
            .build())
          .then(() => done())
          .catch(e => console.log(e));
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should delete a user successfully', function (done) {
        adminusersClient.deleteUser(service_id, remover_id, user_id).should.be.fulfilled
          .then(() => {
          })
          .should.notify(done);
      });
    });

    context('delete user API - missing remover - bad request', () => {

      let empty_remover_id = ' ';
      const removerBodyExpectation = {
        'remover_id': like(empty_remover_id)
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${service_id}/users/${user_id}`)
            .withUponReceiving('an invalid delete user from service request as remover is missing')
            .withMethod('DELETE')
            .withRequestBody(removerBodyExpectation)
            .withResponseHeaders({})
            .withStatusCode(400)
            .build())
          .then(() => done())
          .catch(e => console.log(e));
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should respond 400 when required fields missing', function (done) {
        adminusersClient.deleteUser(service_id, empty_remover_id, user_id).should.be.rejected
          .then((response) => {
            expect(response.errorCode).to.equal(400);
          }).should.notify(done);
      });
    });

    context('delete user API - remove user itself - conflict', () => {

      const removerBodyExpectation = {
        'remover_id': like(remover_id)
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${service_id}/users/${remover_id}`)
            .withUponReceiving('a valid delete user from service request but remover is equal to user to be removed')
            .withMethod('DELETE')
            .withRequestBody(removerBodyExpectation)
            .withResponseHeaders({})
            .withStatusCode(409)
            .build())
          .then(() => done())
          .catch(e => console.log(e));
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should conflict when remover and user to delete coincide', function (done) {
        adminusersClient.deleteUser(service_id, remover_id, remover_id).should.be.rejected
          .then((response) => {
            expect(response.errorCode).to.equal(409);
          })
          .should.notify(done);
      });
    });

    context('delete user API - user does not exist - not found', () => {

      let other_user_id = "user-does-not-exist";

      const removerBodyExpectation = {
        'remover_id': like(remover_id)
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${service_id}/users/${other_user_id}`)
            .withUponReceiving('an invalid delete user from service request as user does not exist')
            .withMethod('DELETE')
            .withRequestBody(removerBodyExpectation)
            .withResponseHeaders({})
            .withStatusCode(404)
            .build())
          .then(() => done())
          .catch(e => console.log(e));
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should return not found when resource is not found (user or service)', function (done) {
        adminusersClient.deleteUser(service_id, remover_id, other_user_id).should.be.rejected
          .then((response) => {
            expect(response.errorCode).to.equal(404);
          })
          .should.notify(done);
      });
    });
  });
});
