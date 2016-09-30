#!/usr/bin/env bash

node_modules/sequelize-cli/bin/sequelize db:migrate

NODE_ENV=production npm start
