FROM          node:0.12.7
ADD           . /app
WORKDIR       /app
RUN           npm install --production
CMD           NODE_ENV=production npm start
