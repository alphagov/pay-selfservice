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
    edit: '/credentials/edit',
    create: '/credentials'
  },

  notificationCredentials: {
    index: '/credentials',
    edit: '/notification-credentials/edit',
    update: '/notification-credentials'
  },

  user: {
    logIn: '/login',
    otpLogIn: '/otp-login',
    otpSendAgain: '/otp-send-again',
    otpSetup: '/otp-setup',
    logOut: '/logout',
    callback: '/callback',
    loggedIn: '/',
    noAccess: '/noaccess',
    forgottenPassword: '/reset-password',
    passwordRequested: '/reset-password-requested',
    forgottenPasswordReset: '/reset-password/:id',
    
    new: '/users/new',
    intro: '/users/intro',
    create: '/users/create',
    index: '/users',
    show: '/users/:id',
    disable: '/users/:id/disable',
    enable: '/users/:id/enable',
    reset: '/users/:id/reset'
  },
  gateway: {
    index: '/gateways'
  },
  devTokens: {
    index: '/tokens',
    revoked: '/tokens/revoked',
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
    update: '/email-notifications/update',
    off: '/email-notifications/off',
    offConfirm: '/email-notifications/off-confirm',
    on: '/email-notifications/on'

  },
  healthcheck: {
    path: '/healthcheck'
  },
  static: {
    naxsiError: "/request-denied"
  },
  generateRoute: require(__dirname + '/utils/generate_route.js')
};
