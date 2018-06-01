FROM govukpay/nodejs:8.11.1

RUN apk update &&\
    apk upgrade &&\
    apk add --update bash ruby

RUN apk --no-cache add ca-certificates wget

RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.27-r0/glibc-2.27-r0.apk

ADD docker/sgerrand.rsa.pub /etc/apk/keys/sgerrand.rsa.pub

RUN apk del libc6-compat && apk add glibc-2.27-r0.apk

# add package.json before source for node_module cache layer
ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install

WORKDIR /app
RUN cp -R /tmp/node_modules .

ENV LD_LIBRARY_PATH /app/node_modules/appmetrics
CMD ./docker/build_and_test.sh
