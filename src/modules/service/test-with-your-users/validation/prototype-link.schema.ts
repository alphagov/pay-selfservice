import { body } from 'express-validator'

const MAX_DESCRIPTION_LENGTH = 230

const prototypeLinkSchema = {
  description: {
    validate: body('description')
      .not()
      .isEmpty()
      .withMessage('Enter a description')
      .bail()
      .isLength({ max: MAX_DESCRIPTION_LENGTH })
      .withMessage('Description must be 230 characters or fewer'),
  },
  confirmationPage: {
    validate: body('confirmationPage')
      .isURL({
        protocols: ['https'],
        require_protocol: true,
      })
      .withMessage('Enter a valid URL starting with https://'),
  },
}

export { prototypeLinkSchema }
