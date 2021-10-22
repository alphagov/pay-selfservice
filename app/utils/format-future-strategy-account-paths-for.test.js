const { expect } = require('chai')

const formatFutureStrategyPathsFor = require('./format-future-strategy-account-paths-for')

describe('formatting future strategy account paths utility', () => {
  it('outputs a full path with service context given relative path and info', () => {
    const path = formatFutureStrategyPathsFor('/webhooks', 'live', 'service-id', 'gateway-account-id')
    expect(path).to.equal('/live/service/service-id/account/gateway-account-id/webhooks')
  })
})
