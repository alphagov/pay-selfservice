#!/bin/bash

set -eu
set -o pipefail

# Make sure we're working from a known directory (the root of the repo)
cd "$(dirname "$0")"

# Usage: update-chamber <version>

# Download a chamber release and calculate the checksum
# Update the Dockerfile with the correct URL

chamber_version=${1?Usage: $0 <chamber version>}

chamber_url="https://github.com/segmentio/chamber/releases/download/v${chamber_version}/chamber-v${chamber_version}-linux-amd64"

# Download & calculate the SHA-256 checksum of this version of chamber
curl --fail --silent -L "$chamber_url" | shasum -a 256 | sed -e 's#-$#bin/chamber#' > chamber.sha256sum

# Rewrite the download URL in the dockerfile
sed -i '' -e "s#^ARG CHAMBER_URL=https://.*#ARG CHAMBER_URL=${chamber_url}#" Dockerfile

# See if the container still builds
docker build .

echo "Dockerfile and chamber checksum file have been updated"
echo "Prepare your commit & raise a PR"
