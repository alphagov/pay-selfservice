var assert = require('assert')
var withCorrelationHeader = require('../../../app/utils/correlation-header.js').withCorrelationHeader

describe('correlation header', function () {
  it('add correlation id header if args exists', function () {
    var argsWithCorrelationHeader = withCorrelationHeader(
      {
        parameters: { foo: 'bar' },
        headers: { 'Content-Type': 'application/json' }
      },
      'some-unique-id')

    assert.deepStrictEqual(argsWithCorrelationHeader,
      {
        parameters: { foo: 'bar' },
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': 'some-unique-id'
        }
      })
  })

  it('add correlation id header if args.header does not exist', function () {
    var argsWithCorrelationHeader = withCorrelationHeader(
      {
        parameters: { foo: 'bar' }
      },
      'some-unique-id')

    assert.deepStrictEqual(argsWithCorrelationHeader,
      {
        parameters: { foo: 'bar' },
        headers: { 'x-request-id': 'some-unique-id' }
      })
  })

  it('add correlation id header if args does not exist', function () {
    var argsWithCorrelationHeader = withCorrelationHeader(null, 'some-unique-id')

    assert.deepStrictEqual(argsWithCorrelationHeader,
      {
        headers: { 'x-request-id': 'some-unique-id' }
      })
  })
})
