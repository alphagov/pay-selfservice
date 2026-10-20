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
}

export { adyenDetailsSchema }
