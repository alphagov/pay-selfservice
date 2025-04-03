import { kebabCase } from 'change-case'
import type { FieldValidationError, Result } from 'express-validator'

interface CustomValidationError extends FieldValidationError {
  pathOverride?: string
}

interface SummaryError {
  text: string
  href: string
}

type FormError = Record<string, string>

function formatValidationErrors (validationResult: Result<FieldValidationError>) {
  const errorSummary: SummaryError[] = validationResult.array().map((error) => {
    const customError = error as CustomValidationError
    return {
      text: error.msg as string,
      href: `#${kebabCase(customError.pathOverride ?? error.path)}`,
    }
  })

  const formErrors = validationResult.array().reduce((acc, error) => {
    acc[error.path] ??= error.msg
    return acc
  }, {} as FormError)
  return {
    errorSummary,
    formErrors,
  }
}

// cjs/esm interop export
export = formatValidationErrors
