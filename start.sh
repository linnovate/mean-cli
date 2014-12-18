#!/bin/bash
set -u

test_self(){
  sudo apt-get install -y -q curl
  npm install bower
  npm install -g
  npm link
  npm test
}

do_as_instructed(){
  cd myApp
  npm install -g
  npm link
}

test_mean_init(){
  local tasker=${TASKER:-gulp}
  if [ "$tasker" = 'grunt' ];then
    echo -e '\n' |  mean init myApp
    do_as_instructed
    grunt test && ( grunt &)
  else
    echo -e '\n' |  mean init myApp
    do_as_instructed
    gulp test && ( gulp &)
  fi
}

test_navigation(){
  while true; do  curl 0.0.0.0:3000 2>/dev/null && break ; sleep 1 ; done
}

cmd_start="$1"
eval "$cmd_start"
