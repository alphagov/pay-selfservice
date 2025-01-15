'use strict'

const { isNotWorldpay3dsFlexOrgUnitId, isNotWorldpay3dsFlexIssuer, isNotWorldpay3dsFlexJwtMacKey } =
    require('../../utils/validation/field-validation-checks')

exports.validateOrgUnitId = (orgUnitId) => {
  const isNotWorldpay3dsFlexOrgUnitIdErrorMessage = isNotWorldpay3dsFlexOrgUnitId(orgUnitId)
  if (isNotWorldpay3dsFlexOrgUnitIdErrorMessage) {
    return {
      valid: false,
      message: isNotWorldpay3dsFlexOrgUnitIdErrorMessage
    }
  }

  return {
    valid: true,
    message: null
  }
}

exports.validateIssuer = (issuer) => {
  const isNotWorldpay3dsFlexIssuerErrorMessage = isNotWorldpay3dsFlexIssuer(issuer)
  if (isNotWorldpay3dsFlexIssuerErrorMessage) {
    return {
      valid: false,
      message: isNotWorldpay3dsFlexIssuerErrorMessage
    }
  }

  return {
    valid: true,
    message: null
  }
}

exports.validateJwtMacKey = (jwtMacKey) => {
  const isNotWorldpay3dsFlexJwtMacKeyErrorMessage = isNotWorldpay3dsFlexJwtMacKey(jwtMacKey)
  if (isNotWorldpay3dsFlexJwtMacKeyErrorMessage) {
    return {
      valid: false,
      message: isNotWorldpay3dsFlexJwtMacKeyErrorMessage
    }
  }

  return {
    valid: true,
    message: null
  }
}
