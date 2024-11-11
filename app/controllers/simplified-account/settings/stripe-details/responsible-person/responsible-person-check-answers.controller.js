const formatSimplifiedAccountPathsFor = require('../../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('../../../../../paths')
const { response } = require('../../../../../utils/response')
const { updateStipeDetailsResponsiblePerson } = require('../../../../../services/stripe-details.service')
const { formatPhoneNumberWithCountryCode } = require('../../../../../utils/telephone-number-utils')
const checkTaskCompletion = require('../../../../../middleware/simplified-account/check-task-completion')
const { stripeDetailsTasks } = require('../../../../../utils/simplified-account/settings/stripe-details/tasks')

async function get (req, res) {
  const { name, dob, address, contact } = req.session.formData
  return response(req, res, 'simplified-account/settings/stripe-details/responsible-person/check-your-answers', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.contactDetails, req.service.externalId, req.account.type),
    changeResponsiblePersonLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index, req.service.externalId, req.account.type),
    changeHomeAddressLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.homeAddress, req.service.externalId, req.account.type),
    changeContactDetailsLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.contactDetails, req.service.externalId, req.account.type),
    answers: {
      name: `${name.firstName} ${name.lastName}`,
      dob: `${dob.dobYear}-${dob.dobMonth}-${dob.dobDay}`,
      address: `${address.homeAddressLine1} <br/>${address?.homeAddressLine2 ? `${address.homeAddressLine2}<br/>` : ''} ${address.homeAddressCity} <br/>${address.homeAddressPostcode}`,
      phone: formatPhoneNumberWithCountryCode(contact.workTelephoneNumber),
      email: contact.workEmail
    }
  })
}

async function post (req, res, next) {
  const { name, dob, address, contact } = req.session.formData
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
  try {
    await updateStipeDetailsResponsiblePerson(req.service, req.account, responsiblePerson)
    delete req.session.formData
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type))
  } catch (err) {
    if (err && err.type === 'StripeInvalidRequestError') {
      switch (err.param) {
        case 'phone':
          return postErrorResponse(req, res, {
            summary: [{ text: 'Invalid work telephone number, please check your answer and try again.' }]
          })
        case 'dob[year]':
          return postErrorResponse(req, res, {
            summary: [{ text: 'Invalid date of birth year, please check your answer and try again.' }]
          })
        default:
          return postErrorResponse(req, res, {
            summary: [{ text: 'We\'ve not been able to save these details. Contact GOV.UK Pay for assistance.' }]
          })
      }
    }
    next(err)
  }
}

const postErrorResponse = (req, res, errors) => {
  const { name, dob, address, contact } = req.session.formData
  return response(req, res, 'simplified-account/settings/stripe-details/responsible-person/check-your-answers', {
    errors,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.contactDetails, req.service.externalId, req.account.type),
    changeResponsiblePersonLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index, req.service.externalId, req.account.type),
    changeHomeAddressLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.homeAddress, req.service.externalId, req.account.type),
    changeContactDetailsLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.contactDetails, req.service.externalId, req.account.type),
    answers: {
      name: `${name.firstName} ${name.lastName}`,
      dob: `${dob.dobYear}-${dob.dobMonth}-${dob.dobDay}`,
      address: `${address.homeAddressLine1} <br/>${address?.homeAddressLine2 ?? ''} <br/>${address.homeAddressCity} <br/>${address?.homeAddressCounty ?? ''} <br/>${address.homeAddressPostcode}`,
      phone: formatPhoneNumberWithCountryCode(contact.workTelephoneNumber),
      email: contact.workEmail
    }
  })
}

module.exports = {
  get: [checkTaskCompletion(stripeDetailsTasks.responsiblePerson.name), get],
  post: [checkTaskCompletion(stripeDetailsTasks.responsiblePerson.name), post]
}
