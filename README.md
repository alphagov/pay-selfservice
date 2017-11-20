# pay-selfservice
GOV.UK Pay Self Service portal (Node.js)

We use [Architecture Decision Records](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) to keep track of the history of software design decisions on this application. Please see [docs/arch](docs/arch/).

## Key environment variables

if you wish to override any variables, please do the following:


setup
```
cd $WORKSPACE/pay-selfservice/config
cp dev-env.json.example dev-env.json
```


to edit
```
cd ~/workspace/pay-selfservice/config
vi dev-env.json

```

to test
```
npm run compile && npm test
```

to run
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


#set this to 'true' only if you are running self service in a non HTTPS environment.
SECURE_COOKIE_OFF=true


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

| Form param               | always present | Description                               |
| ------------------------ |:--------:| -----------------------------------------       |
| `reference`              | X | The service reference for a given payment |
| `email`                  | X | The user email address used for the given payment |
| `status   `              | X | The payment status |
| `fromDate   `            | X | A starting date to search for payments|
| `toDate   `              | X | An ending date to search for payments|

## Transaction Events list

View the transaction events list for a given account id.

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

## Licence

[MIT License](LICENSE)

## Responsible Disclosure

GOV.UK Pay aims to stay secure for everyone. If you are a security researcher and have discovered a security vulnerability in this code, we appreciate your help in disclosing it to us in a responsible manner. We will give appropriate credit to those reporting confirmed issues. Please e-mail gds-team-pay-security@digital.cabinet-office.gov.uk with details of any issue you find, we aim to reply quickly.

testing
