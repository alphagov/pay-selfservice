module.exports = {
    root: "/",
    transactions: {
      index: '/transactions',
      download: '/transactions/download',
      show: '/transactions/:chargeId'
    },
    credentials: {
      index: '/credentials',
      edit: '/credentials?edit', // TODO LOLWUT?
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
    generateRoute: require(__dirname + '/utils/generate_route.js')
};
