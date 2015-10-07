FROM          node:0.12.7

ADD           . /app
WORKDIR       /app

ENV PORT      9000
EXPOSE        9000

RUN           npm install --production

CMD           NODE_ENV=production npm start

