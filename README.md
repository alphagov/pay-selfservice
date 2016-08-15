# pay-selfservice
GOV.UK Pay Self Service portal (Node.js)

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
| NODE_WORKER_COUNT           |   | 1 | The number of worker threads started by node cluster when run in production mode |

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

#### How to use delete-session.js

This script is used to force log out a user from selfservice.
Make sure to have the selfservice database environment variables set before running this script.

Usage:
```
./node delete-session.js -u <email-address> ## Where email-address is the id of user you want to delete the session
```