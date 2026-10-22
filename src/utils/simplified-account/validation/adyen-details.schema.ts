import { body } from 'express-validator'

const adyenDetailsSchema = {
  acceptTerms: {
    validate: body('acceptTerms')
      .notEmpty()
      .withMessage('Select the checkbox to confirm that you have the legal authority to accept these terms'),
  },
  selectGovernmentActivity: {
    validate: body('governmentActivity').notEmpty().withMessage('You must make a selection'),
  },
  vatRegistrationNumber: {
    validate: body('vatRegistrationNumber')
      .trim()
      .notEmpty()
      .withMessage('Enter a VAT number')
      .bail()
      .custom((value: string) => {
        if (!/^((GB)?((\d{9})|(\d{12})|((GD)([0-4])(\d{2}))|((HA)([5-9])(\d{2}))))$/.test(value)) {
          throw new Error('Enter a valid VAT registration number')
        }
        return true
      }),
  },
}

export { adyenDetailsSchema }
