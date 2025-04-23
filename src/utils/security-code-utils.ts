function sanitiseSecurityCode (code: string) {
  return code?.replace(/[\s-–]/g, '')
}

export {
  sanitiseSecurityCode
}
