# pay-selfservice
Payments Selfservice application in NodeJS

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
