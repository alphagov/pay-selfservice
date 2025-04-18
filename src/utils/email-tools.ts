// @ts-expect-error amdefine weirdness
import rfc822Validator from 'rfc822-validate'

function isValidEmail (email: string) {
  if (!(rfc822Validator as (email: string) => boolean)(email)) {
    return false
  } else {
    const domain = email.split('@')[1]
    return !(domain && !domain.includes('.'))
  }
}

function isInternalGDSEmail (email: string) {
  const internalEmailDomain = process.env.GDS_INTERNAL_USER_EMAIL_DOMAIN
  if (internalEmailDomain) {
    return email.includes(internalEmailDomain)
  } else {
    return false
  }
}

export {
  isValidEmail,
  isInternalGDSEmail
}
