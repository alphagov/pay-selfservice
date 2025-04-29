const paths = require('@root/paths')

const stripeDetailsTasks = Object.freeze({
  bankAccount: {
    name: 'bankAccount',
    friendlyName: 'Organisation\'s bank details',
    path: paths.simplifiedAccount.settings.stripeDetails.bankDetails
  },
  responsiblePerson: {
    name: 'responsiblePerson',
    friendlyName: 'Responsible person',
    path: paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index
  },
  director: {
    name: 'director',
    friendlyName: 'Service director',
    path: paths.simplifiedAccount.settings.stripeDetails.director
  },
  vatNumber: {
    name: 'vatNumber',
    friendlyName: 'VAT registration number',
    path: paths.simplifiedAccount.settings.stripeDetails.vatNumber
  },
  companyNumber: {
    name: 'companyNumber',
    friendlyName: 'Company registration number',
    path: paths.simplifiedAccount.settings.stripeDetails.companyNumber
  },
  organisationDetails: {
    name: 'organisationDetails',
    friendlyName: 'Confirm your organisation\'s name and address match your government entity document',
    path: paths.simplifiedAccount.settings.stripeDetails.organisationDetails.index
  },
  governmentEntityDocument: {
    name: 'governmentEntityDocument',
    friendlyName: 'Government entity document',
    path: paths.simplifiedAccount.settings.stripeDetails.governmentEntityDocument
  }
})
module.exports = {
  stripeDetailsTasks
}
