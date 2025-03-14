const { body } = require('express-validator')
const { formatPhoneNumberWithCountryCode } = require('@utils/telephone-number-utils')
const { postcodeRegex } = require('@utils/validation/postcode-validation')

const responsiblePersonSchema = {
  name: {
    firstName: {
      validate: body('firstName')
        .notEmpty()
        .withMessage('Enter the first name')
        .bail()
        .isLength({ max: 100 })
        .withMessage('First name must be 100 characters or fewer')
    },
    lastName: {
      validate: body('lastName')
        .notEmpty()
        .withMessage('Enter the last name')
        .bail()
        .isLength({ max: 100 })
        .withMessage('Last name must be 100 characters or fewer')
    }
  },
  dob: {
    validate: body('dobDay') // Use just one DOB field as the anchor to prevent multiple validations
      .custom((value, { req }) => {
        const { dobDay, dobMonth, dobYear } = req.body
        if (!dobDay && !dobMonth && !dobYear) {
          throw new Error('Enter the date of birth')
        }

        // Stripe requires minimum age of 13
        const day = Number(dobDay)
        const month = Number(dobMonth) - 1
        const year = Number(dobYear)

        const dob = new Date(year, month, day)
        const today = new Date()

        let age = today.getFullYear() - dob.getFullYear()
        const monthDiff = today.getMonth() - dob.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--
        }

        if (age < 13) {
          throw new Error('Date of birth cannot be younger than 13')
        }
        return true
      })
      .bail(),
    dobDay: {
      validate: body('dobDay')
        .if((value, { req }) => {
          const { dobDay, dobMonth, dobYear } = req.body
          return dobDay || dobMonth || dobYear
        })
        .trim()
        .notEmpty()
        .withMessage('Date of birth must include a day')
        .bail()
        .isInt({ min: 1, max: 31 })
        .withMessage('Day of birth must be a number between 1 and 31')
    },
    dobMonth: {
      validate: body('dobMonth')
        .if((value, { req }) => {
          const { dobDay, dobMonth, dobYear } = req.body
          return dobDay || dobMonth || dobYear
        })
        .trim()
        .notEmpty()
        .withMessage('Date of birth must include a month')
        .bail()
        .isInt({ min: 1, max: 12 })
        .withMessage('Month of birth must be a number between 1 and 12')
    },
    dobYear: {
      validate: body('dobYear')
        .if((value, { req }) => {
          const { dobDay, dobMonth, dobYear } = req.body
          return dobDay || dobMonth || dobYear
        })
        .trim()
        .notEmpty()
        .withMessage('Date of birth must include a year')
        .bail()
        .isInt({ min: 1900, max: new Date().getFullYear() })
        .withMessage('Enter a valid year of birth')
    }
  },
  address: {
    homeAddressLine1: {
      validate: body('homeAddressLine1')
        .trim()
        .notEmpty()
        .withMessage('Address line 1 is required')
        .bail()
        .isLength({ max: 200 })
        .withMessage('Address line 1 must be 200 characters or fewer')
    },
    homeAddressLine2: {
      validate: body('homeAddressLine2')
        .optional({ values: 'falsy' })
        .isLength({ max: 200 })
        .withMessage('Address line 2 must be 200 characters or fewer')
    },
    homeAddressCity: {
      validate: body('homeAddressCity')
        .trim()
        .notEmpty()
        .withMessage('Town or city is required')
        .bail()
        .isLength({ max: 100 })
        .withMessage('Town or city must be 100 characters or fewer')
    },
    homeAddressPostcode: {
      validate: body('homeAddressPostcode')
        .trim()
        .notEmpty()
        .withMessage('Postcode is required')
        .bail()
        .matches(postcodeRegex)
        .withMessage('Enter a real postcode')
    }
  },
  contactDetails: {
    workTelephoneNumber: {
      validate: body('workTelephoneNumber')
        .trim()
        .notEmpty()
        .withMessage('Work telephone number is required')
        .bail()
        .custom(value => {
          formatPhoneNumberWithCountryCode(value)
          return true
        })
        .withMessage('Enter a valid work telephone number')
    },
    workEmail: {
      validate: body('workEmail')
        .trim()
        .notEmpty()
        .withMessage('Work email is required')
        .bail()
        .isEmail()
        .withMessage('Enter a real email address')
    }
  }
}

module.exports = {
  responsiblePersonSchema,
  RESPONSIBLE_PERSON_NAME_AND_DOB_VALIDATIONS: [
    responsiblePersonSchema.name.firstName.validate,
    responsiblePersonSchema.name.lastName.validate,
    responsiblePersonSchema.dob.validate,
    responsiblePersonSchema.dob.dobDay.validate,
    responsiblePersonSchema.dob.dobMonth.validate,
    responsiblePersonSchema.dob.dobYear.validate
  ],
  RESPONSIBLE_PERSON_HOME_ADDRESS_VALIDATIONS: [
    responsiblePersonSchema.address.homeAddressLine1.validate,
    responsiblePersonSchema.address.homeAddressLine2.validate,
    responsiblePersonSchema.address.homeAddressCity.validate,
    responsiblePersonSchema.address.homeAddressPostcode.validate
  ],
  RESPONSIBLE_PERSON_CONTACT_DETAILS_VALIDATIONS: [
    responsiblePersonSchema.contactDetails.workTelephoneNumber.validate,
    responsiblePersonSchema.contactDetails.workEmail.validate
  ]
}
