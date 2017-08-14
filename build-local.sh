#!/bin/bash
docker build --file docker/build_and_test.Dockerfile -t govukpay/selfservice-build:local . &&\
docker run --volume $(pwd):/app:rw govukpay/selfservice-build:local &&\
docker build -t govukpay/selfservice:local .
