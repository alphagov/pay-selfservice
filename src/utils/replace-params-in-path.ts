const formatPathFor = (path: string, ...pathParams: string[]): string => {
  const paramNames = path.split('/').filter((segment) => segment.startsWith(':'))
  paramNames.forEach((paramName, index) => {
    if (pathParams[index]) {
      path = path.replace(paramName, encodeURIComponent(pathParams[index]))
    }
  })
  return path
}

export = formatPathFor
