import { kebabCase } from 'change-case'
import type { FieldValidationError, Result, ValidationError } from 'express-validator'

interface FieldValidationWithPathOverrideError extends FieldValidationError {
  pathOverride?: string
  msg: string
}

interface SummaryError {
  text: string
  href: string
}

type FormError = Record<string, string>

export interface Errors {
  summary: SummaryError[]
  formErrors?: FormError
}

export function formatValidationErrors(validationResult: Result<ValidationError>) {
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
