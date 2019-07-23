#!/bin/bash
if ! [ -x "$(command -v cypress)" ]; then 
  echo "Cypress not found in this environment"
  echo "For development, Cypress can be added with \`npm i -g cypress\`"
  echo "For CI Cypress should be available through the container node"
  exit 1
fi 

COMMAND=${1:-run}
echo "Cypress found in environment, executing $COMMAND"
cypress "$COMMAND"
