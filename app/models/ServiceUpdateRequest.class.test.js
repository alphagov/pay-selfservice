'use strict'

const { expect } = require('chai')
const { ServiceUpdateRequest } = require('./ServiceUpdateRequest.class')

describe('the ServiceUpdateRequest model', () => {
  it('should successfully add a "replace" request', () => {
    const payload = new ServiceUpdateRequest().replace().currentGoLiveStage('live').formatPayload()
    expect(payload).to.deep.equal([{
      op: 'replace',
      path: 'current_go_live_stage',
      value: 'live'
    }])
  })

  it('should successfully add an "add" request', () => {
    const payload = new ServiceUpdateRequest().add().currentGoLiveStage('live').formatPayload()
    expect(payload).to.deep.equal([{
      op: 'add',
      path: 'current_go_live_stage',
      value: 'live'
    }])
  })

  it('should successfully add multiple requests', () => {
    const payload = new ServiceUpdateRequest()
      .replace().currentGoLiveStage('live')
      .replace().currentPspTestAccountStage('a-stage')
      .replace().merchantDetails.name('my-org')
      .add().merchantDetails.addressPostcode('SW11AA')
      .add().merchantDetails.addressCountry('GB')
      .formatPayload()

    expect(payload).to.deep.equal([
      {
        op: 'replace',
        path: 'current_go_live_stage',
        value: 'live'
      },
      {
        op: 'replace',
        path: 'current_psp_test_account_stage',
        value: 'a-stage'
      },
      {
        op: 'replace',
        path: 'merchant_details/name',
        value: 'my-org'
      },
      {
        op: 'add',
        path: 'merchant_details/address_postcode',
        value: 'SW11AA'
      },
      {
        op: 'add',
        path: 'merchant_details/address_country',
        value: 'GB'
      }
    ])
  })
})
