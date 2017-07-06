const proxyquire = require('proxyquire');
const sinon = require('sinon');
const q = require('q');
const chai = require('chai');

const expect = chai.expect;

const paths = require('../../../../app/paths.js');

describe('Error handler register service', function () {

  let correlationId, req, res, flashStub, redirectStub, renderStub, statusStub, email, telephoneNumber, password;

  beforeEach(() => {

    process.env.SERVICE_REGISTRATION_ENABLED = true;

    correlationId = 'abcde12345';
    email = 'be@gov.uk';
    telephoneNumber = '07512345678'
    password = 'password1234';

    flashStub = sinon.spy();

    req = {
      correlationId,
      body: {
        email,
        'telephone-number': telephoneNumber,
        password
      },
      flash: flashStub
    };

    redirectStub = sinon.spy();
    renderStub = sinon.spy();
    statusStub = sinon.spy();

    res = {
      setHeader: flashStub,
      redirect: redirectStub,
      render: renderStub,
      status: statusStub
    };
  });

  afterEach(() => {
    delete process.env.SERVICE_REGISTRATION_ENABLED;

    flashStub.reset();
    redirectStub.reset();
    renderStub.reset();
    statusStub.reset();
  });

  const controller = function (error) {
    return proxyquire('../../../../app/controllers/create_service_controller.js',
      {
        '../services/service_registration_service': {
          submitRegistration: () => {
            const defer = q.defer();
            defer.reject(error);

            return defer.promise;
          }
        }
      });
  };

  it('should handle 400 as 303 redirect to index', function (done) {
    email = 'be@mail.com';
    const errorMessage = `Invalid input`;
    const error = {
      errorCode: 400,
      message: {
        errors: errorMessage
      }
    };

    controller(error).submitRegistration(req, res).should.be.fulfilled
      .then(() => {
        expect(flashStub.calledWith('genericError', errorMessage)).to.equal(true);
        expect(redirectStub.calledWith(303, paths.selfCreateService.register)).to.equal(true);
      }).should.notify(done);
  });

  it('should handle 403 as 303 redirect to index', function (done) {
    email = 'be@mail.com';
    const errorMessage = `Email [${email}] is not a valid public sector email`;
    const error = {
      errorCode: 403,
      message: {
        errors: errorMessage
      }
    };

    controller(error).submitRegistration(req, res).should.be.fulfilled
      .then(() => {
        expect(flashStub.calledWith('genericError', errorMessage)).to.equal(true);
        expect(redirectStub.calledWith(303, paths.selfCreateService.register)).to.equal(true);
      }).should.notify(done);
  });

  it('should handle 409 as 303 redirect to index', function (done) {
    email = 'be@mail.com';
    const errorMessage = `email [${email}] already exists`;
    const error = {
      errorCode: 409,
      message: {
        errors: errorMessage
      }
    };

    controller(error).submitRegistration(req, res).should.be.fulfilled
      .then(() => {
        expect(flashStub.calledWith('genericError', errorMessage)).to.equal(true);
        expect(redirectStub.calledWith(303, paths.selfCreateService.register)).to.equal(true);
      }).should.notify(done);
  });

  it('should handle no error code as 303 redirect to index', function (done) {
    telephoneNumber = '0751234567';
    const error = 'Invalid phone number';

    controller(error).submitRegistration(req, res).should.be.fulfilled
      .then(() => {
        expect(flashStub.calledWith('genericError', error)).to.equal(true);
        expect(redirectStub.calledWith(303, paths.selfCreateService.register)).to.equal(true);
      }).should.notify(done);
  });

  it('should handle 404 as 303 redirect to error page', function (done) {
    email = 'be@mail.com';
    const errorCode = 404;
    const errorMessage = `[${correlationId}] ${errorCode} An error has occurred. Rendering error view - errorMessage=Unable to process registration at this time`;
    const error = {
      errorCode,
      message: {
        errors: errorMessage
      }
    };

    controller(error).submitRegistration(req, res).should.be.fulfilled
      .then(() => {
        expect(statusStub.calledWith(errorCode)).to.eq(true);
        expect(renderStub.calledWith('error', { message: 'Unable to process registration at this time' })).to.equal(true);
      }).should.notify(done);
  });
});