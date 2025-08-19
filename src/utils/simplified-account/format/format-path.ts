export function formattedPathFor (path: string, ...pathParams: string[]) {
  const paramNames = path.split('/').filter((segment) => segment.startsWith(':'))
  paramNames.forEach((paramName, index) => {
    if (pathParams[index]) {
      path = path.replace(paramName, encodeURIComponent(pathParams[index]))
    }
  })
  return path
}
