# pay-selfservice

GOV.UK Pay Self Service admin tool (Node.js)

## Prerequisites

* [Pay CLI](https://www.npmjs.com/package/@govuk-pay/cli)
* You
  have [set up your local development environment](https://manual.payments.service.gov.uk/manual/development-processes/setup-local-dev-environment.html)

### Running locally

Start the backend services locally in docker, using the Pay CLI.

```bash
pay local up --cluster admin
```

Generate the environment variables file. This only needs to be done the first time you run locally.

```bash
./scripts/generate-dev-environment.sh local
```

Check that you are using the right version of Node, which should match what specified in package.json for engines/node.

```bash
node -v
```

If the node version is not what specified in package.json, then you need to install it and set it, e.g. for 22.14.0:

```bash
nvm install 22.14.0
nvm use
nvm alias default 22.14.0
```

Run the following in the project root to start the app:

```bash
npm i
npm run dev
 ```

Open the application in browser:

* <http://127.0.0.1:3000>

#### Watching for changes

The local development server (`npm run dev`) will watch for any changes to files in the `src` directory and rebuild the
bundles automatically.

Any changes to the server code will restart the app; changes to client side assets (SCSS/JS) and Nunjucks views will be
reloaded automatically without a restart.

### Running via Pay CLI

```bash
pay local up --cluster admin --mount-local-node-apps --local selfservice
```

This command will watch changes in your workspace and rebuild them in a Pay CLI managed `selfservice` task

## Running tests

### To run tests

```bash
npm run test
```

This command will run all [mocha](https://mochajs.org/) test suites matching the glob patterns `*.test.js` or
`*.test.ts`

To run Cypress tests start the server in a separate terminal

```bash
npm run cypress:server
```

_This runs both the Cypress server and @govuk-pay/run-amock which is the mock server used for stubbing out external API
calls._

You can run Cypress tests headless or in a locally installed browser

```bash
npm run cypress:test # headless
npm run cypress:test-headed # in a browser
```

#### Debugging Cypress tests

You can start the Cypress server with in-line source maps and auto reload enabled by running
`npm run cypress:dev-server`.
This will allow you to set breakpoints and step through the source when running a spec.

## Key environment variables

| Variable               | required |  default value  | Description                                                                                                                                           |
|------------------------|:--------:|:---------------:|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| BIND_HOST              |          |    127.0.0.1    | The IP address for the application to bind to                                                                                                         |
| PORT                   |    ✅     |      3000       | The port number for the express server to be bound at runtime                                                                                         |
| SESSION_ENCRYPTION_KEY |    ✅     |                 | Key to be used by the cookie encryption algorithm. Should be a large unguessable string ([More Info](https://www.npmjs.com/package/client-sessions)). |
| PUBLIC_AUTH_URL        |    ✅     |                 | The publicauth endpoint to use when API Tokens.                                                                                                       |
| CONNECTOR_URL        |    ✅     |                 | The endpoint to connector base URL.                                                                                                                   |
| DISABLE_INTERNAL_HTTPS |          | false/undefined | To switch off generating secure cookies. Set this to `true` only if you are running self service in a `non HTTPS` environment.                        |
| HTTP_PROXY             |          |                 | HTTP proxy url                                                                              
| NO_PROXY               |          |                 | host:port(s) that need to be by passed by the proxy. Supports comma separated list                                                                    |

## Licence

[MIT License](LICENSE)

## Vulnerability Disclosure

GOV.UK Pay aims to stay secure for everyone. If you are a security researcher and have discovered a security
vulnerability in this code, we appreciate your help in disclosing it to us in a responsible manner. Please refer to
our [vulnerability disclosure policy](https://www.gov.uk/help/report-vulnerability) and
our [security.txt](https://vdp.cabinetoffice.gov.uk/.well-known/security.txt) file for details.
