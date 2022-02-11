FROM node:12.22.7-alpine3.12@sha256:99eaf1312b1926bc6db27d7230c8b3118d4ad2db64cc6a8a8304adeb8bad283b

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
