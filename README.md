# pay-selfservice
GOV.UK Pay Self Service portal (Node.js)

## Running in Development Mode

Steps are as follows:

1. Use a docker-compose environment to run everything (such as database) that you don't want to develop on right now.
2. Stop `pay-selfservice` in the docker (`docker stop pay-selfservice`), to get ready to run from your checked out copy instead.
3. Because our journeys expect selfservice to be accessible to the browser on dockerhost (not localhost), run the redirect script to send these requests to localhost.
3. Use `env.sh` to pick up the same environment variables from `pay-scripts`, so configuration is set correctly, including telling the service here how to communicate with other services that may be running in docker or on your local machine. (This assumes `$WORKSPACE/pay-scripts` exists)

For example:

```
$ ./redirect.sh start
$ ./env.sh npm start
...
(pay-selfservice log output)
...
(press CTRL+C to stop service)
...
$ ./redirect.sh stop
```

## Key environment variables

| Variable                    | required | default value | Description                               |
| --------------------------- |:--------:|:-------------:| ----------------------------------------- |
| PORT                        | X | 9200 | The port number for the express server to be bound at runtime |
| SESSION_ENCRYPTION_KEY      | X |      | key to be used by the cookie encryption algorithm. Should be a large unguessable string ([More Info](https://www.npmjs.com/package/client-sessions)).  |
| PUBLIC_AUTH_URL             | X |      | The publicauth endpoint to use when API Tokens. |
| PUBLIC_AUTH_URL             | X |      | The endpoint to connector base URL. |
| AUTH0_URL                   | X |      | The auth0 endpoint to use during single sign-on  |
| AUTH0_CLIENT_ID             | X |      | auth0 client-id to use during single sign-on verifications |
| AUTH0_CLIENT_SECRET         | X |      | auth0 password to use during single sign-on verifications |
| NODE_TLS_REJECT_UNAUTHORIZED| X |   1  | indicating whether a server should automatically reject clients with invalid certificates. Only applies to servers with requestCert enabled |
| SECURE_COOKIE_OFF           |   | false/undefined | To switch off generating secure cookies. Set this to `true` only if you are running self service in a `non HTTPS` environment. |
| HTTP_PROXY_ENABLED          |   | false/undefined | To enable proxying outbound traffic of HTTP(S) requests. If set to `true` make sure to set the following 3 variables |
| HTTP_PROXY                  |   |      | HTTP proxy url |
| HTTPS_PROXY                 |   |      | HTTPS proxy url |
| NO_PROXY                    |   |      | host:port(s) that need to be by passed by the proxy. Supports comma separated list |

# authstub does not have a valid certificate
NODE_TLS_REJECT_UNAUTHORIZED=0

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
