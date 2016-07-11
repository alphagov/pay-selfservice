module.exports = {
  root: "/",
  transactions: {
    index: '/transactions',
    download: '/transactions/download',
    show: '/transactions/:chargeId',
    refund: '/transactions/:chargeId/refund'
  },
  credentials: {
    index: '/credentials',
    edit: '/credentials?edit',
    create: '/credentials'
  },
  user: {
    logIn: '/login',
    logOut: '/logout',
    callback: '/callback',
    loggedIn: '/',
    noAccess: '/noaccess'
  },
  devTokens: {
    index: '/tokens',
    // we only show the token once, hence strange url
    show: '/tokens/generate',
    create: '/tokens/generate',
    // should these two not rely take an id in the url?
    update: '/tokens',
    delete: '/tokens'
  },
  serviceName: {
    index: '/service-name',
    edit: '/service-name?edit'
  },
  paymentTypes: {
    selectType: '/payment-types/select-type',
    selectBrand: '/payment-types/select-brand',
    summary: '/payment-types/summary'
  },
  emailNotifications: {
    index: '/email-notifications',
    edit: '/email-notifications/edit',
    confirm: '/email-notifications/confirm',
    update: '/email-notifications/update'

  },
  healthcheck: {
    path: '/healthcheck'
  },
  generateRoute: require(__dirname + '/utils/generate_route.js')
};
