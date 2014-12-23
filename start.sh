#!/bin/bash
set -u

test_self(){
  sudo apt-get install -y -q curl
  npm install bower
  npm install -g
  npm link
  npm test
}

user_instructions(){
  npm install -g
  npm link .
  mean status
  grunt test
  grunt &
}

test_navigation(){
  while true; do  curl 0.0.0.0:3000 2>/dev/null && break ; sleep 1 ; done
}

test_mean_init(){
    echo -e '\n' |  mean init myApp
    cd myApp
    user_instructions
    test_navigation
}

tests(){
  test_self
  test_mean_init
}
steps(){
  chmod +x ./capture.sh
  bash -c ./capture.sh
  cp /tmp/session* $CIRCLE_ARTIFACTS/
  #tests
}

steps