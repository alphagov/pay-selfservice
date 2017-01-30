const sinon = require('sinon');

module.exports = {
  getStubbedRes: () => {
    return {
      redirect: sinon.stub(),
      render: sinon.stub()
    };
  }
};
