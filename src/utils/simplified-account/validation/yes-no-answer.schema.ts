import { body } from 'express-validator'

const validateYesNoAnswer = (fieldName: string) => {
  return body(fieldName)
    .toLowerCase()
    .isIn(['yes', 'no'])
    .withMessage('Select either \'Yes\' or \'No\'')
}

export {
  validateYesNoAnswer
}
