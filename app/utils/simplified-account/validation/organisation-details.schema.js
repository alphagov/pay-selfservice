const { body } = require('express-validator')
const { invalidTelephoneNumber } = require('@utils/telephone-number-utils')
const { isValidUrl } = require('@utils/validation/server-side-form-validations')
const { postcodeRegex } = require('@utils/validation/postcode-validation')

const ORGANISATION_NAME_MAX_LENGTH = 100
const ADDRESS_FIELD_MAX_LENGTH = 255

const organisationDetailsSchema = {
  organisationName: {
    validate: body('organisationName').trim()
      .notEmpty()
      .withMessage('Enter an organisation name')
      .bail()
      .isLength({ max: ORGANISATION_NAME_MAX_LENGTH })
      .withMessage(`Organisation name must be ${ORGANISATION_NAME_MAX_LENGTH} characters or fewer`)
  },
  organisationAddress: {
    line1: {
      validate: body('addressLine1').trim()
        .notEmpty()
        .withMessage('Enter a building and street')
        .bail()
        .isLength({ max: ADDRESS_FIELD_MAX_LENGTH })
        .withMessage(`Building and street must be ${ADDRESS_FIELD_MAX_LENGTH} characters or fewer`)
    },
    line2: {
      validate: body('addressLine2').trim()
        .isLength({ max: ADDRESS_FIELD_MAX_LENGTH })
        .withMessage(`Building and street must be ${ADDRESS_FIELD_MAX_LENGTH} characters or fewer`)
    },
    city: {
      validate: body('addressCity').trim()
        .notEmpty()
        .withMessage('Enter a town or city')
        .bail()
        .isLength({ max: ADDRESS_FIELD_MAX_LENGTH })
        .withMessage(`Town or city must be ${ADDRESS_FIELD_MAX_LENGTH} characters or fewer`)
    },
    postcode: {
      validate: body('addressPostcode').trim()
        .notEmpty()
        .withMessage('Enter a postcode')
        .bail()
        .custom((postcode, { req }) =>
          (req.body?.addressCountry && req.body.addressCountry === 'GB') // only validate GB postcodes
            ? postcodeRegex.test(postcode)
            : true)
        .withMessage('Enter a real postcode')
    },
    country: {
      validate: body('addressCountry').trim()
        .notEmpty()
        .withMessage('Select a country')
        .bail()
        .isLength({ min: 2, max: 2 }).withMessage('Select a country')
    }
  },
  telephoneNumber: {
    validate: body('telephoneNumber').trim()
      .notEmpty()
      .withMessage('Enter a telephone number')
      .bail()
      .custom(telephoneNumber => !invalidTelephoneNumber(telephoneNumber))
      .withMessage('Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
  },
  organisationUrl: {
    validate: body('organisationUrl').trim()
      .notEmpty()
      .withMessage('Enter a website address')
      .bail()
      .custom(isValidUrl)
      .withMessage('Enter a valid website address')
  }
}

module.exports.organisationDetailsSchema = organisationDetailsSchema
