const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format/')
const { checkTaskCompletion } = require('@middleware/simplified-account')
const paths = require('@root/paths')
const { response } = require('@utils/response')
const { updateStripeDetailsResponsiblePerson } = require('@services/stripe-details.service')
const { formatPhoneNumberWithCountryCode } = require('@utils/telephone-number-utils')
const { stripeDetailsTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')
const { formatAddressAsParagraph } = require('@utils/format-address-as-paragraph')
const { FORM_STATE_KEY } = require('@controllers/simplified-account/settings/stripe-details/responsible-person/constants')
const _ = require('lodash')

async function get (req, res) {
  const { name, dob, address, contact } = _.get(req, FORM_STATE_KEY, {})
  if (!Object.values({ name, dob, address, contact }).every(Boolean)) {
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index, req.service.externalId, req.account.type))
  }
  return response(req, res, 'simplified-account/settings/stripe-details/responsible-person/check-your-answers', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.contactDetails, req.service.externalId, req.account.type),
    changeResponsiblePersonLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index, req.service.externalId, req.account.type),
    changeHomeAddressLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.homeAddress, req.service.externalId, req.account.type),
    changeContactDetailsLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.contactDetails, req.service.externalId, req.account.type),
    answers: {
      name: `${name.firstName} ${name.lastName}`,
      dob: `${dob.dobYear}-${dob.dobMonth}-${dob.dobDay}`,
      address: formatAddressAsParagraph({ line1: address.homeAddressLine1, line2: address.homeAddressLine2, city: address.homeAddressCity, postcode: address.homeAddressPostcode }),
      phone: formatPhoneNumberWithCountryCode(contact.workTelephoneNumber),
      email: contact.workEmail
    }
  })
}

async function post (req, res, next) {
  const { name, dob, address, contact } = _.get(req, FORM_STATE_KEY, {})
  const responsiblePerson = {
    first_name: name.firstName,
    last_name: name.lastName,
    dob_day: Number(dob.dobDay),
    dob_month: Number(dob.dobMonth),
    dob_year: Number(dob.dobYear),
    phone: formatPhoneNumberWithCountryCode(contact.workTelephoneNumber),
    email: contact.workEmail,
    address_line1: address.homeAddressLine1,
    address_city: address.homeAddressCity,
    address_postcode: address.homeAddressPostcode,
    ...(address.homeAddressLine2 && { address_line2: address.homeAddressLine2 })
  }
  updateStripeDetailsResponsiblePerson(req.service, req.account, responsiblePerson)
    .then(() => {
      _.unset(req, FORM_STATE_KEY)
      res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type))
    })
    .catch((err) => {
      if (err.type === 'StripeInvalidRequestError') {
        switch (err.param) {
          case 'phone':
            return postErrorResponse(req, res, {
              summary: [{ text: 'There is a problem with your telephone number. Please check your answer and try again.' }]
            })
          default:
            return postErrorResponse(req, res, {
              summary: [{ text: 'There is a problem with the information you\'ve submitted. We\'ve not been able to save your details. Email govuk-pay-support@digital.cabinet-office.gov.uk for help.' }]
            })
        }
      }
      next(err)
    })
}

const postErrorResponse = (req, res, errors) => {
  const { name, dob, address, contact } = _.get(req, FORM_STATE_KEY, {})
  return response(req, res, 'simplified-account/settings/stripe-details/responsible-person/check-your-answers', {
    errors,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.contactDetails, req.service.externalId, req.account.type),
    changeResponsiblePersonLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index, req.service.externalId, req.account.type),
    changeHomeAddressLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.homeAddress, req.service.externalId, req.account.type),
    changeContactDetailsLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.contactDetails, req.service.externalId, req.account.type),
    answers: {
      name: `${name.firstName} ${name.lastName}`,
      dob: `${dob.dobYear}-${dob.dobMonth}-${dob.dobDay}`,
      address: ['homeAddressLine1', 'homeAddressLine2', 'homeAddressCity', 'homeAddressPostcode'].map(k => address?.[k]).filter(v => v && v !== '').join('<br>'),
      phone: formatPhoneNumberWithCountryCode(contact.workTelephoneNumber),
      email: contact.workEmail
    }
  })
}

module.exports = {
  get: [checkTaskCompletion(stripeDetailsTasks.responsiblePerson.name), get],
  post: [checkTaskCompletion(stripeDetailsTasks.responsiblePerson.name), post]
}
