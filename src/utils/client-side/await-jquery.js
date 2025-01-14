const awaitJQuery = (callback, maxWaitTime = 2000) => {
  const startTime = Date.now()
  function check () {
    if (typeof jQuery !== 'undefined') {
      callback()
      return
    }
    if (Date.now() - startTime >= maxWaitTime) {
      return
    }
    setTimeout(check, 100)
  }
  check()
}

export default awaitJQuery
