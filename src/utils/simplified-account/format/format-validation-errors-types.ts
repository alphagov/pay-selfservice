import type { FieldValidationError } from 'express-validator'

export interface FieldValidationWithPathOverrideError extends FieldValidationError {
  pathOverride?: string
  msg: string
}

export interface SummaryError {
  text: string
  href: string
}

export type FormError = Record<string, string>

export interface Errors {
  summary: SummaryError[]
  formErrors?: FormError
}
