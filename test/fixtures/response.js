const sinon = require('sinon')

module.exports = {
  getStubbedRes: () => {
    return {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
  }
}
