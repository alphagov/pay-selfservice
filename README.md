# pay-selfservice
GOV.UK Pay Self Service admin tool (Node.js)

## Prerequisites
* This requires the [Pay CLI](https://github.com/alphagov/pay-infra/tree/master/cli), which is not publicly available at present.
* You have [set up your local development environment](https://pay-team-manual.cloudapps.digital/manual/setup-local-dev-environment.html)
* Clone this repo locally.

### Running

Self service reads from environment variables that allow it to connect to backend services from any environment.

#### Tunnel - easiest method
Tunneling into different test and staging environments allows you to test with environment specific data.

Steps to connect to tunnelled environment:

```
npm install && npm run compile

./scripts/tunnel.sh test-12   # tunnels into environment `test-12`
./scripts/generate-dev-environment.sh tunnel  # generate environment variables for tunnel

npm run start:dev

```
Open application in browser: 
- http://localhost:3000

#### Local Docker
If you have the backend services running locally in docker, you can connect directly to them.

```
 npm install && npm run compile

 pay local launch admin
 ./scripts/generate-dev-environment.sh local

 npm run start:dev
```

Open application in browser: 
- http://localhost:3000

##### Log output
When using Docker, you can view log out with the following command:
```
docker logs -f selfservice
```

#### Debug using Visual Studio Code
* You need to make sure the app runs locally first using the steps in the [Running](#running) section.
* In VSCode, go to the `Debug` view (on MacOS, use shortcut `CMD + shift + D`).
* From the **Run** toolbar, select tne launch config `Self Service`.
* Add breakpoints to any file you want to debug - click in the left hand column and a red dot will appear.
* Press The `green play` button (`F5` MacOS):
    * This will run the app in debug mode.
    * Uses `nodemon` so it will automatically restart on code changes.



#### Watching for changes

You shouldn’t need to restart the app to see changes you make.

We use [nodemon](https://github.com/remy/nodemon) which watches for changes to files and restarts the node process.

If you’re making changes to client-side JS or Sass files (anything within [`/browsered/`](https://github.com/alphagov/pay-selfservice/tree/BAU-update-README-to-explain-livereload/app/browsered) or [`/assets/`](https://github.com/alphagov/pay-selfservice/tree/BAU-update-README-to-explain-livereload/app/assets)) then running `npm run watch-live-reload` will watch for changes and recompile. Nodemon does not do anything here as that’s not necessary. If you install the [livereload browser plugin](http://livereload.com/extensions/) then it will refresh your page once the assets have been compiled to the `/public` folder.

## Running tests

#### To run mocha tests
```
npm run compile && npm test
```
#### Debug tests using Visual Studio Code

##### IMPORTANT NOTE - some tests do not work in debug mode
* Some integration tests do not work in debug mode.  This is because the tests are dependent on other tests running before hand.
* Nevertheless, it is still useful to debug tests that do work in debug mode.

##### Run tests in debug mode
* In VSCode, go to the `Debug` view (on MacOS, use shortcut `CMD + shift + D`).
* From the **Run** toolbar, select the launch config you want to run:
  * `Mocha All` - runs all tests.
  * `Mocha Current File` - only run currently open test file.
* Add breakpoints to any file you want to debug - click in the left hand column and a red dot will appear.
* Press The `green play` button or `F5`.

#### To run cypress tests

Run in two separate terminals:
1. `npm run cypress:server`

    _This runs both the Cypress server and Mountebank which is the virtualisation server used for stubbing out external API calls._

2. Either:
- `npm run cypress:test` to run headless 
- `npm run cypress:test-headed` to run headed

See [About Cypress tests in selfservice](./test/cypress/cypress-testing.md) for more information about running and writing Cypress tests.

## Key environment variables

| Variable                    | required | default value | Description                               |
| --------------------------- |:--------:|:-------------:| ----------------------------------------- |
| PORT                        | X | 9200 | The port number for the express server to be bound at runtime |
| SESSION_ENCRYPTION_KEY      | X |      | Key to be used by the cookie encryption algorithm. Should be a large unguessable string ([More Info](https://www.npmjs.com/package/client-sessions)).  |
| PUBLIC_AUTH_URL             | X |      | The publicauth endpoint to use when API Tokens. |
| PUBLIC_AUTH_URL             | X |      | The endpoint to connector base URL. |
| DISABLE_INTERNAL_HTTPS      |   | false/undefined | To switch off generating secure cookies. Set this to `true` only if you are running self service in a `non HTTPS` environment. |
| HTTP_PROXY_ENABLED          |   | false/undefined | To enable proxying outbound traffic of HTTP(S) requests. If set to `true` make sure to set the following 3 variables |
| HTTP_PROXY                  |   |      | HTTP proxy url |
| HTTPS_PROXY                 |   |      | HTTPS proxy url |
| NO_PROXY                    |   |      | host:port(s) that need to be by passed by the proxy. Supports comma separated list |
| NODE_WORKER_COUNT           |   | 1 | The number of worker threads started by node cluster when run in production mode |
    
## Architecture Decision Records

We use [Architecture Decision Records](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) to keep track of the history of software design decisions on this application. Please see [docs/arch](docs/arch/).

## Licence

[MIT License](LICENSE)

## Vulnerability Disclosure

GOV.UK Pay aims to stay secure for everyone. If you are a security researcher and have discovered a security vulnerability in this code, we appreciate your help in disclosing it to us in a responsible manner. Please refer to our [vulnerability disclosure policy](https://www.gov.uk/help/report-vulnerability) and our [security.txt](https://vdp.cabinetoffice.gov.uk/.well-known/security.txt) file for details.
