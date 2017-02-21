#!/bin/bash

#docker build -t govukpay/selfservice:local .
docker build -t selfservice-test -f Dockerfile.test .
