# pay-selfservice
Payments Selfservice application in NodeJS

## View transaction list

```
    /transactions/{gatewayAccountId}
```

| Path param               | always present | Description                               |
| ------------------------ |:--------:| -----------------------------------------       |
| `gatewayAccountId`       | X | The account Id for which the transaction should be retrieved  |


#### example 

```
/transactions/111222333 
```
