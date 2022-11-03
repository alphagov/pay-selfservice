'use strict'

const { response } = require('../../../utils/response')
const { getCurrentCredential } = require('../../../utils/credentials')
const { getExistingResponsiblePersonName } = require('../stripe-setup.util')

module.exports = async function showResponsiblePersonAdditionalDetailsForm (req, res, next) {
  try {
    const currentCredential = getCurrentCredential(req.account)

    const responsiblePersonName = await getExistingResponsiblePersonName(req.account, false)
    return response(req, res, 'stripe-setup/responsible-person/kyc-additional-information', {
      responsiblePersonName,
      currentCredential
    })
  } catch (err) {
    next(err)
  }
}
