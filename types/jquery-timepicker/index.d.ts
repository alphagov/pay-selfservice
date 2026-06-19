interface TimePickerOptions {
  showDuration?: boolean
  timeFormat?: string
  roundingFunction?: (...params: unknown[]) => unknown
}

interface JQuery {
  timepicker(options?: TimePickerOptions): JQuery
}
