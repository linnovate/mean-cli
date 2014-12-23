#!/usr/bin/env bash
set -u

set_env(){
export file_cfg=test/SH/config.cfg
export file_capture=test/SH/capture.sh
source $file_cfg
}

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
cd -
}

tests(){
test_self
test_mean_init
}

navigation(){
chmod +x $file_capture
( bash -c $file_capture )
}

steps(){
set_env
tests
navigation
}

steps
