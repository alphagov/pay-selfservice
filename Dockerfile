FROM govukpay/nodejs:alpine-3.8

ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install --production

ENV PORT 9000
EXPOSE 9000

WORKDIR /app
ADD . /app
ENV LD_LIBRARY_PATH /app/node_modules/appmetrics
RUN ln -s /tmp/node_modules /app/node_modules

CMD npm start
