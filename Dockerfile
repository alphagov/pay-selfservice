FROM govukpay/nodejs:6.12.2

# ---------------------------------------------------------------
# -- FOLLOWING SECTION ONLY REQUIRED FOR HEAPDUMP (NPM MODULE) --
# ---------------------------------------------------------------
RUN apk update &&\
    apk upgrade &&\
    apk add --update g++ python make
# ---------------------------------------------------------------
# ---------------------------------------------------------------

ADD package.json /tmp/package.json
RUN cd /tmp && npm install --production

ENV PORT 9000
EXPOSE 9000

WORKDIR /app
ADD . /app
ENV LD_LIBRARY_PATH /app/node_modules/appmetrics
RUN ln -s /tmp/node_modules /app/node_modules

CMD npm start
