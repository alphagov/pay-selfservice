function sanitiseHtmlValue(value: string | undefined) {
  return value?.replace(/<[^>]+>/g, '')
}

function sanitiseSecurityCode(code: string) {
  return code?.replace(/[\s-–]/g, '')
}

export { sanitiseHtmlValue, sanitiseSecurityCode }
