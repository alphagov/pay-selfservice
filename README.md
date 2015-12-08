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


## Transaction list

View the transaction list for a given account id.

```
    /transactions/{gatewayAccountId}
```

| Path param               | always present | Description                               |
| ------------------------ |:--------:| -----------------------------------------       |
| `gatewayAccountId`       | X | The account Id for which the transaction should be retrieved  |


#### Developer tokens

Generate, edit and revoke tokens for a given account id.

```
    /tokens/{gatewayAccountId}
```

| Path param               | always present | Description                               |
| ------------------------ |:--------:| -----------------------------------------       |
| `gatewayAccountId`       | X | The account Id for which the developer tokens are generated  |
