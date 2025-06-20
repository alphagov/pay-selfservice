import { kebabCase } from 'change-case'
import type { Result, ValidationError } from 'express-validator'
import type {
  FieldValidationWithPathOverrideError, FormError,
  SummaryError,
} from '@utils/simplified-account/format/format-validation-errors-types'

function formatValidationErrors(validationResult: Result<ValidationError>) {
  const errorSummary: SummaryError[] = validationResult.array().map((error) => {
    if (error.type === 'field') {
      const err = error as FieldValidationWithPathOverrideError
      return {
        text: err.msg,
        href: `#${kebabCase(err.pathOverride ?? error.path)}`,
      }
    } else {
      return {
        text: error.msg as string,
        href: `#`,
      }
    }
  })

  const formErrors = validationResult.array().reduce<FormError>((acc, error) => {
    if (error.type === 'field') {
      acc[error.path] ??= error.msg
    }
    return acc
  }, {})
  return {
    errorSummary,
    formErrors,
  }
}

// cjs/esm interop export
export = formatValidationErrors
