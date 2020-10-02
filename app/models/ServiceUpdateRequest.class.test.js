'use strict'

const { ServiceUpdateRequest } = require('./ServiceUpdateRequest.class')

describe('the ServiceUpdateRequest model', () => {
  it('should successfully add a "replace" request', () => {
    const payload = new ServiceUpdateRequest().replace('foo', 'bar').formatPayload()
    expect(payload).toEqual([{
      'op': 'replace',
      'path': 'foo',
      'value': 'bar'
    }])
  })

  it('should successfully add an "add" request', () => {
    const payload = new ServiceUpdateRequest().add('foo', 'bar').formatPayload()
    expect(payload).toEqual([{
      'op': 'add',
      'path': 'foo',
      'value': 'bar'
    }])
  })

  it('should successfully add multiple requests', () => {
    const payload = new ServiceUpdateRequest()
      .replace('replace-path-1', 'replace-value-1')
      .replace('replace-path-2', 'replace-value-2')
      .add('add-path', 'add-value')
      .formatPayload()

    expect(payload).toEqual([
      {
        'op': 'replace',
        'path': 'replace-path-1',
        'value': 'replace-value-1'
      },
      {
        'op': 'replace',
        'path': 'replace-path-2',
        'value': 'replace-value-2'
      },
      {
        'op': 'add',
        'path': 'add-path',
        'value': 'add-value'
      }
    ])
  })
})
