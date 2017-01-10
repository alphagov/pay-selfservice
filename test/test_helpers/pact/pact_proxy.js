let wrapper = require('@pact-foundation/pact-node');
let path = require('path');

const pactBrokerUrl = "http://192.168.99.100";

module.exports = {

  create: function(port) {
    return wrapper.createServer({
      host: "localhost",
      port: port,
      log: path.resolve(process.cwd(), 'logs', 'mockserver-contract.log'),
      dir: path.resolve(process.cwd(), 'pacts'),
      spec: 2
    });
  },

  publish: function() {
    return wrapper.publishPacts({
      pactUrls: [path.resolve(process.cwd(), 'pacts')],
      pactBroker: pactBrokerUrl,
      consumerVersion: "1"
    })
  }
};
