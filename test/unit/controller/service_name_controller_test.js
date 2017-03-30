var sinon = require('sinon');
var chai = require('chai');
var nock = require('nock');

var serviceNameController = require(__dirname + '/../../../app/controllers/service_name_controller');
var userFixtures = require(__dirname + '/../../fixtures/user_fixtures');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = chai.expect;
var connectorMock = nock(process.env.ADMINUSERS_URL);
var SERVICE_NAME_UPDATE_PATH = '/v1/api/services';
var renderSpy = sinon.spy();
var redirectSpy = sinon.spy();

describe('service name update controller', function () {

  let serviceId = '1';
  let usernameToView = 'other-user';

  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

})