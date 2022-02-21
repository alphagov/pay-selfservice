FROM node:12.22.10-alpine3.15@sha256:f150ebf9402f0dd6a9c4cb208ed64884cfa7c8a6ccae3f749a7b12156c25ad88

RUN ["apk", "--no-cache", "upgrade"]

RUN ["apk", "add", "--no-cache", "tini"]

ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm ci --production

ENV PORT 9000
EXPOSE 9000

WORKDIR /app
ADD . /app
RUN ["ln", "-s", "/tmp/node_modules", "/app/node_modules"]

ENTRYPOINT ["tini", "--"]

CMD ["npm", "start"]
