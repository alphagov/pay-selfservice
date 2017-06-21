let proxyquire = require('proxyquire');
let sinon = require('sinon');
let q = require('q');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Error handler', function () {

  let correlationId, req, res, setHeaderStub, statusStub, renderStub;

  beforeEach(() => {
    correlationId = 'abcde12345';
    req = {
      correlationId: correlationId,
      params: {
        code: 'ndjkadh3182wdoq'
      }
    };

    setHeaderStub = sinon.spy();
    statusStub = sinon.spy();
    renderStub = sinon.spy();

    res = {
      setHeader: setHeaderStub,
      status: statusStub,
      render: renderStub
    };
  });

  afterEach(() => {
    setHeaderStub.reset();
    statusStub.reset();
    renderStub.reset();
  });

  let controller = function (errorCode) {
    return proxyquire(__dirname + '/../../../app/controllers/register_user_controller.js',
      {
        '../services/user_registration_service': {
          getValidatedInvite: () => {
            let defer = q.defer();
            defer.reject({errorCode: errorCode});
            return defer.promise;
          }
        }
      });
  };


  it('should handle 404 as unable to process registration at this time', function (done) {

    let errorCode = 404;

    controller(errorCode).validateInvite(req, res).should.be.fulfilled
      .then(() => {
        expect(statusStub.calledWith(errorCode)).to.eq(true);
        expect(renderStub.calledWith('error', { message: 'Unable to process registration at this time' })).to.eq(true);
      }).should.notify(done);
  });

  it('should handle 410 as this invitation link has expired', function (done) {
    let errorCode = 410;

    controller(errorCode).validateInvite(req, res).should.be.fulfilled
      .then(() => {
        expect(statusStub.calledWith(errorCode)).to.eq(true);
        expect(renderStub.calledWith('error', { message: 'This invitation is no longer valid' })).to.eq(true);
      }).should.notify(done);
  });

  it('should handle undefined as unable to process registration at this time with error code 500', function (done) {
    let errorCode = undefined;

    controller(errorCode).validateInvite(req, res).should.be.fulfilled
      .then(() => {
        expect(statusStub.calledWith(500)).to.eq(true);
        expect(renderStub.calledWith('error', { message: 'Unable to process registration at this time' })).to.eq(true);
      }).should.notify(done);
  });
});