'use strict';

// Node.js core dependencies
const assert = require('assert');

// NPM dependencies
const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe('error_handler middleware', function () {
  const winstonErrorSpy = sinon.spy();
  const renderErrorViewSpy = sinon.spy();
  const envIsProductionStub = sinon.stub();
  const envIsDevelopmentStub = sinon.stub();
  const errorHandler = proxyquire(__dirname + '/../../../app/middleware/error_handler', {
    'winston': {
      error: winstonErrorSpy
    },
    '../utils/response': {
      renderErrorView: renderErrorViewSpy
    },
    '../../env': {
      'isProduction': envIsProductionStub,
      'isDevelopment': envIsDevelopmentStub
    }
  });

  afterEach(() => {
    winstonErrorSpy.reset();
    renderErrorViewSpy.reset();
    envIsProductionStub.resetBehavior();
    envIsDevelopmentStub.resetBehavior();
  });

  it('should log string error and render error view in production', function (done) {
    envIsProductionStub.returns(true);
    envIsDevelopmentStub.returns(false);
    const err = 'Error text';
    const req = {
      originalUrl: 'originalUrl',
      url: 'url',
      correlationId: 'correlationId',
    };
    const res = {};
    const next = sinon.spy();

    errorHandler(err, req, res, next);

    const errorPayload = {
      request: {
        originalUrl: req.originalUrl,
        url: req.url
      },
      error: {
        message: err
      }
    };
    assert(winstonErrorSpy.calledWith(`[requestId=${req.correlationId}] Internal server error -`, errorPayload));
    assert(renderErrorViewSpy.calledWith(req, res, 'Sorry, something went wrong', 200));

    done();
  });

  it('should log string error and throw it in development', function (done) {
    envIsProductionStub.returns(false);
    envIsDevelopmentStub.returns(true);
    const err = 'Error text';
    const req = {
      originalUrl: 'originalUrl',
      url: 'url',
      correlationId: 'correlationId',
    };
    const res = {};
    const next = sinon.spy();

    errorHandler(err, req, res, next);

    const errorPayload = {
      request: {
        originalUrl: req.originalUrl,
        url: req.url
      },
      error: {
        message: err
      }
    };
    assert(winstonErrorSpy.calledWith(`[requestId=${req.correlationId}] Internal server error -`, errorPayload));
    assert.equal(renderErrorViewSpy.notCalled, true);
    assert(next.calledWith(err));

    done();
  });

  it('should log object error and render error view in production', function (done) {
    envIsProductionStub.returns(true);
    envIsDevelopmentStub.returns(false);
    const err = {
      message: 'error message',
      stack: 'error stack',
    };
    const req = {
      originalUrl: 'originalUrl',
      url: 'url',
      correlationId: 'correlationId',
    };
    const res = {};
    const next = sinon.spy();

    errorHandler(err, req, res, next);

    const errorPayload = {
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
    assert(renderErrorViewSpy.calledWith(req, res, 'Sorry, something went wrong', 200));

    done();
  });

  it('should log object error and throw it in development', function (done) {
    envIsProductionStub.returns(false);
    envIsDevelopmentStub.returns(true);
    const err = {
      message: 'error message',
      stack: 'error stack',
    };
    const req = {
      originalUrl: 'originalUrl',
      url: 'url',
      correlationId: 'correlationId',
    };
    const res = {};
    const next = sinon.spy();

    errorHandler(err, req, res, next);

    const errorPayload = {
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
    assert.equal(renderErrorViewSpy.notCalled, true);
    assert(next.calledWith(err));

    done();
  });
});
