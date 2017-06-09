let proxyquire = require('proxyquire');
let sinon = require('sinon');
let assert = require('assert');

describe('error_handler middleware', function () {
  let winstonErrorSpy = sinon.spy();
  let renderErrorView = sinon.spy();
  let errorHandler = proxyquire(__dirname + '/../../../app/middleware/error_handler.js', {
    'winston': {
      error: winstonErrorSpy
    },
    '../utils/response.js': {
      renderErrorView: renderErrorView
    }
  });

  afterEach(() => {
    winstonErrorSpy.reset();
    renderErrorView.reset();
  });

  it('should log string error and render error view', function (done) {
    let err = 'Error text';
    let req = {
      originalUrl: 'originalUrl',
      url: 'url',
      correlationId: 'correlationId',
    };
    let res = {};
    let next = sinon.spy();

    errorHandler(err, req, res, next);

    let errorPayload = {
      request: {
        originalUrl: req.originalUrl,
        url: req.url
      },
      error: {
        message: err
      }
    };
    assert(winstonErrorSpy.calledWith(`[requestId=${req.correlationId}] Internal server error -`, errorPayload));
    assert(renderErrorView.calledWith(req, res, 'Sorry, something went wrong', 200));

    done();
  });

  it('should log object error and render error view', function (done) {
    let err = {
      message: 'error message',
      stack: 'error stack',
    };
    let req = {
      originalUrl: 'originalUrl',
      url: 'url',
      correlationId: 'correlationId',
    };
    let res = {};
    let next = sinon.spy();

    errorHandler(err, req, res, next);

    let errorPayload = {
      request: {
        originalUrl: req.originalUrl,
        url: req.url
      },
      error: {
        message: err.message,
        stack: err.stack
      }
    };
    assert(winstonErrorSpy.calledWith(`[requestId=${req.correlationId}] Internal server error -`, errorPayload));
    assert(renderErrorView.calledWith(req, res, 'Sorry, something went wrong', 200));

    done();
  });
});
