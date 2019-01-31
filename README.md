# pay-selfservice
GOV.UK Pay Self Service admin tool (Node.js)

## Running locally with `pay local`

*This requires the [Pay CLI](https://github.com/alphagov/pay-infra/tree/master/cli), which is not publicly available at present*

### Prerequisites
You have [set up your local development environment](https://pay-team-manual.cloudapps.digital/development-processes/setup-local-dev-environment/)

### Steps to run locally
* Clone repo to your `$WORKSPACE` eg `cd $WORKSPACE && git clone git@github.com:alphagov/pay-selfservice.git && cd pay-selfservice`
* `npm install`
* `npm run compile`
* `pay local launch admin --local selfservice`
* Go to: http://localhost:9400

Assuming you're up and running with the [Pay CLI](https://github.com/alphagov/pay-infra/tree/master/cli) and have selfservice running locally you shouldn’t need to restart the app to see changes you make.

We use [nodemon](https://github.com/remy/nodemon) which watches for changes to files and restarts the node process.

You can watch Nodemon do it’s thing if you run `docker logs -f selfservice`.

If you’re making changes to client-side JS or Sass files (anything within [`/browsered/`](https://github.com/alphagov/pay-selfservice/tree/BAU-update-README-to-explain-livereload/app/browsered) or [`/assets/`](https://github.com/alphagov/pay-selfservice/tree/BAU-update-README-to-explain-livereload/app/assets)) then running `npm run watch-live-reload` will watch for changes and recompile. Nodemon does not do anything here as that’s not necessary. If you install the [livereload browser plugin](http://livereload.com/extensions/) then it will refresh your page once the assets have been compiled to the `/public` folder.

## Key environment variables

If you wish to override any variables, please do the following:


Setup
```
cd $WORKSPACE/pay-selfservice/config
cp dev-env.json.example dev-env.json
```


To edit
```
cd ~/workspace/pay-selfservice/config
vi dev-env.json

```

To run mocha tests
```
npm run compile && npm test
```

To run cypress tests

Run in two separate terminals:
1. `npm run cypress:server`

    _Note: this runs both the Cypress server and Mountebank which is the virtualisation server used for stubbing out external API calls._

2. Either:
- `npm run cypress:test` to run headless 
- `npm run cypress:test-headed` to run headed

To run
```
LOCAL_ENV=true msl run

```

| Variable                    | required | default value | Description                               |
| --------------------------- |:--------:|:-------------:| ----------------------------------------- |
| PORT                        | X | 9200 | The port number for the express server to be bound at runtime |
| SESSION_ENCRYPTION_KEY      | X |      | Key to be used by the cookie encryption algorithm. Should be a large unguessable string ([More Info](https://www.npmjs.com/package/client-sessions)).  |
| PUBLIC_AUTH_URL             | X |      | The publicauth endpoint to use when API Tokens. |
| PUBLIC_AUTH_URL             | X |      | The endpoint to connector base URL. |
| SECURE_COOKIE_OFF           |   | false/undefined | To switch off generating secure cookies. Set this to `true` only if you are running self service in a `non HTTPS` environment. |
| HTTP_PROXY_ENABLED          |   | false/undefined | To enable proxying outbound traffic of HTTP(S) requests. If set to `true` make sure to set the following 3 variables |
| HTTP_PROXY                  |   |      | HTTP proxy url |
| HTTPS_PROXY                 |   |      | HTTPS proxy url |
| NO_PROXY                    |   |      | host:port(s) that need to be by passed by the proxy. Supports comma separated list |
| NODE_WORKER_COUNT           |   | 1 | The number of worker threads started by node cluster when run in production mode |


# Secure Cookie
Set this to 'true' only if you are running self service in a non HTTPS environment.
```
SECURE_COOKIE_OFF=true
```


## Transaction list

View the transaction list for a given account id.

```
    GET /transactions
```

## Transaction Search

Search transactions by reference, status and from and to date

```
    POST /transactions
```

| Form param               | Always present | Description                               |
| ------------------------ |:--------:| -----------------------------------------       |
| `reference`              | X | The service reference for a given payment |
| `email`                  | X | The user email address used for the given payment |
| `status   `              | X | The payment status |
| `fromDate   `            | X | A starting date to search for payments|
| `toDate   `              | X | An ending date to search for payments|

## Transaction Events List

View the transaction events list for a given charge id.

```
    GET /transactions/{chargeId}
```

| Path param               | always present | Description                               |
| ------------------------ |:--------:| -----------------------------------------       |
| `chargeId`               | X | The charge Id for which the transaction events should be retrieved  |


#### Developer tokens

Generate, edit and revoke tokens for a given account id.

```
    /tokens
```

We use [Architecture Decision Records](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) to keep track of the history of software design decisions on this application. Please see [docs/arch](docs/arch/).

## Licence

[MIT License](LICENSE)

## Responsible Disclosure

GOV.UK Pay aims to stay secure for everyone. If you are a security researcher and have discovered a security vulnerability in this code, we appreciate your help in disclosing it to us in a responsible manner. We will give appropriate credit to those reporting confirmed issues. Please e-mail gds-team-pay-security@digital.cabinet-office.gov.uk with details of any issue you find, we aim to reply quickly.
