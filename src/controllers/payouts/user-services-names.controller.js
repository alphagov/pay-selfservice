const indexServiceNamesByGatewayAccountId = function indexServiceNamesByGatewayAccountId (user) {
  const services = (user && user.serviceRoles) || []
  return services.reduce((aggregate, serviceRole) => {
    serviceRole.service.gatewayAccountIds.forEach((gatewayAccountId) => {
      aggregate[gatewayAccountId] = serviceRole.service.serviceName.en
    })
    return aggregate
  }, {})
}

module.exports = {
  indexServiceNamesByGatewayAccountId
}
