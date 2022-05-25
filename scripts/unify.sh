#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

SC_DIR=$1
SC_NAME=$2

rm -f unified/flat_"$SC_NAME".sol

npx truffle-flattener contracts/"$SC_DIR"/"$SC_NAME".sol >> unified/flat_"$SC_NAME".sol
