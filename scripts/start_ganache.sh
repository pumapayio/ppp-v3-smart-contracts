#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

FORK=$1
MAINNET=$2
BLOCK_NUMBER=$3

ganache_port=8545

cleanup() {
  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p "$ganache_pid" > /dev/null; then
    kill -9 "$ganache_pid"
  fi
}

ganache_running() {
  nc -z localhost "$ganache_port"
}

start_ganache() {
  local mnemonic="coin town lawn where smart cancel rebel syrup pass useful fox body"
  local balance=10000000000000000
  local gasPrice=1000000000
  local gasLimit=0xfffffffffff
  local network_id=1111
  local chain_id=999
  local fork=""

  if [ "$FORK" = true ]; then
    chain_id=80001
    fork="https://matic-mumbai.chainstacklabs.com"
  fi

  if [ "$FORK" = true ] && [ "$MAINNET" = true ]; then
    chain_id=137
    fork="https://matic-mainnet.chainstacklabs.com/"
  fi

  if [ "$FORK" = true ] && [ "$BLOCK_NUMBER" != "" ]; then
    fork="$fork@$BLOCK_NUMBER"
  fi

  if [ "$FORK" = true ]; then
    npx ganache-cli --port "$ganache_port" -m "$mnemonic" -e "$balance" -g "$gasPrice" -l "$gasLimit" -a 20 -f "$fork"  -b 1 --chain.chainId "$chain_id" -i "$network_id"
  else
    npx ganache-cli --port "$ganache_port" -e "$balance" -g "$gasPrice" -l "$gasLimit" -a 10 --chainId "$chain_id" -i "$network_id" ## -m "$mnemonic"
  fi

  ganache_pid=$!

  echo "Waiting for ganache to launch on port "$ganache_port"..."

  while ! ganache_running; do
    sleep 0.5 # wait for 1/10 of the second before check again
  done

  echo "Ganache launched!"
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  echo "Starting our own ganache instance"
  start_ganache
fi
