# pay-selfservice
GOV.UK Pay Self Service portal (Node.js)

## Key environment variables

if you wish to override any variables, please do the following, this could be useful for testing live notify as an example


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

to run
```
LOCAL_ENV=true msl run

```

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

## migrations
to run migrations
```
./env.sh node_modules/sequelize-cli/bin/sequelize db:migrate
```

## to create your user for local testing
copy create_user.js.example to create_user.js
edit with your details
` ./env.sh node create_user.js`

## to get a 2fa token
` ./env.sh node 2fa-token.js -u example@example.com`

## to disable a user
` ./env.sh node disable-user.js -u example@example.com`


## to enable a user
` ./env.sh node enable-user.js -u example@example.com`

## to update username or user email 

Use the change_user.js command line script 
```
Usage:  `node change-user.js`
```
#### to change user email
` node change-user.js -e example@example.com -n updated@example.com`

#### to change user name
` node change-user.js -e example@example.com -u updatedUserName`
