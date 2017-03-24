var wrapper = require('@pact-foundation/pact-node');
const pactBrokerUrl = "http://192.168.99.100";
var path = require('path');

module.exports = {
  create: function (host, port) {
    return wrapper.createServer({
      host: host || 'localhost',
      port: port || Math.floor(Math.random() * 40000) + 1024,
      log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
      dir: path.resolve(process.cwd(), 'pacts'),
      spec: 2
    });
  },

  publish: function (cb) {
    return wrapper.publishPacts({
      pactUrls: [path.resolve(process.cwd(), 'pacts')],
      pactBroker: pactBrokerUrl,
      consumerVersion: "1",
      tags: ['expecting_bob']
    })
      .then(cb);
  },

  removeAll: function () {
    return wrapper.removeAllServers();
  }
};
