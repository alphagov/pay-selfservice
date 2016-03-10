'use strict';

module.exports = function () {

  var use = function () {
    if (process.env.HTTP_PROXY_ENABLED !== 'true') {
      delete process.env.HTTP_PROXY;
      delete process.env.HTTPS_PROXY;
      delete process.env.NO_PROXY;
    }
  };

  return {
    use: use
  };

}();
