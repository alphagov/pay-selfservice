const formatPathFor = (path: string, ...pathParams: string[]): string => {
  let paramIndex = 0

  // Unwrap optional segments: {/:param} -> /:param and :param? -> :param
  const unwrapped = path.replace('{/', '/').replace('}', '')

  const segments = unwrapped.split('/')
  const result: string[] = []

  segments.forEach((segment) => {
    if (segment.startsWith(':')) {
      const value = pathParams[paramIndex]
      paramIndex++
      if (value) {
        result.push(encodeURIComponent(value))
      }
    } else {
      result.push(segment)
    }
  })

  return result.join('/')
}

export = formatPathFor
