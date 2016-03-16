FROM node:5.7

ENV PORT 9000
ENV ENABLE_NEWRELIC no
ENV NEW_RELIC_HOME /app/newrelic

EXPOSE 9000

# install squid & proxychains
RUN apt-get update && apt-get install -y squid3 proxychains

# add package.json before source for node_module cache
ADD package.json /tmp/package.json
RUN cd /tmp && npm install

ADD . /app
WORKDIR /app

# copy cached node_modules to /app/node_modules
RUN mkdir -p /app && cp -a /tmp/node_modules /app/

RUN npm install && npm test && npm prune --production

RUN rm /etc/proxychains.conf
ADD sidecar/proxychains.conf /etc/proxychains.conf 

RUN rm /etc/squid3/squid.conf
ADD sidecar/squid.conf /etc/squid3/squid.conf

CMD /usr/sbin/squid3 -f /etc/squid3/squid.conf && NODE_ENV=production proxychains npm start
