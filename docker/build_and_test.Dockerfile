FROM govukpay/nodejs:8.11.1

RUN apk update &&\
    apk upgrade &&\
    apk add --update bash ruby

ADD docker/sgerrand.rsa.pub /etc/apk/keys/sgerrand.rsa.pub

RUN apk --no-cache add ca-certificates
RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.26-r0/glibc-2.26-r0.apk
RUN apk del libc6-compat && apk add glibc-2.26-r0.apk

# add package.json before source for node_module cache layer
ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install
WORKDIR /app
ENV LD_LIBRARY_PATH /app/node_modules/appmetrics
CMD ./docker/build_and_test.sh
