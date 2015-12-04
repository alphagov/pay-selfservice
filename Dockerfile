FROM node:0.12.7

ENV PORT 9000
ENV ENABLE_NEWRELIC no
ENV NEW_RELIC_HOME /app/newrelic

ADD . /app
WORKDIR /app
RUN npm install --production
CMD NODE_ENV=production npm start
