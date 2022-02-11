FROM node:12.22.4-alpine3.12@sha256:a199f64c814f12fb00fa81a6e1c7f964e260a127f2b64ac526a358f3152c0f66

# add package.json before source for node_module cache layer
ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install
WORKDIR /app
CMD ./docker/build_and_test.sh
