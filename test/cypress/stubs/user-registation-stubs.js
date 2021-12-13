'use strict'

const productFixtures = require('../../fixtures/invite.fixtures')
const { stubBuilder } = require('./stub-builder')

function patchUpdateServiceNameSuccess (opts) {
    const path = `/v1/api/services/${opts.serviceExternalId}`
    return stubBuilder('POST', path, 200, {
      request: serviceFixtures.validRegistrationRequest({
        en: opts.serviceName.en,
        cy: opts.serviceName.cy || ''
      }),
      verifyCalledTimes: opts.verifyCalledTimes
    })
}

module.exports = {
  getProductsByGatewayAccountIdAndTypeStub,
  getProductByExternalIdStub,
  deleteProductStub,
  getProductsByGatewayAccountIdAndTypeFailure,
  postCreateProductSuccess
}
