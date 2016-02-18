FROM node:5.6.0

ENV PORT 9000
ENV ENABLE_NEWRELIC no
ENV NEW_RELIC_HOME /app/newrelic

EXPOSE 9000

ADD . /app
WORKDIR /app
RUN npm install --production
CMD NODE_ENV=production npm start
