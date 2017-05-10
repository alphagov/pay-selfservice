let responseConverter = require(__dirname + '/../../../app/utils/response_converter');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
let q = require('q');

let defer;
let context;
describe('response converter', function () {

  beforeEach(() => {
    defer = q.defer();
    context = {
      url: 'http://example.com',
      defer: defer,
      startTime: new Date(),
      correlationId: 'bob',
      method: 'POST',
      description: 'sample request',
      service: 'sample service'
    };
  });

  let noError = undefined;
  let body = {};

  it('should resolve if response is any one of success codes', function (done) {
    let converter = responseConverter.createCallbackToPromiseConverter(context);
    let successResponse = {statusCode: 201};
    converter(noError, successResponse, body);

    defer.promise.should.be.fulfilled
      .notify(done);

  });

  it('should reject if response returned with a non success code', function (done) {
    let converter = responseConverter.createCallbackToPromiseConverter(context);
    let errorResponse = {statusCode: 401};
    converter(noError, errorResponse, body);

    defer.promise.should.be.rejected.then((res) => {
      expect(res.errorCode).to.equal(401);
    }).should.notify(done);

  });

  it('should reject if response returned with an error', function (done) {
    let converter = responseConverter.createCallbackToPromiseConverter(context);
    let response = {};
    let error = 'error';
    converter(error, response, body);

    defer.promise.should.be.rejected.then((res) => {
      expect(res.error).to.equal('error');
    }).should.notify(done);

  });
});
