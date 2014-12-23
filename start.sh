#!/usr/bin/env bash
set -u

set_env(){
export dir_root=$(pwd)
export file_cfg=$dir_root/test/sh/config.cfg
export file_capture=$dir_root/test/sh/capture.sh
export address=0

if [ "$LOGNAME" = travis ];then
  address='0.0.0.0:3000'
else
  address='0.0.0.0:3001'
fi

test -f $file_capture
test -f $file_cfg

chmod +x $file_capture
source $file_cfg
}

test_self(){
sudo apt-get install -y -q curl
npm install bower
npm install -g
npm link
npm test
}

grunt_stuff(){
commander cat Gruntfile.js
commander grunt test || { exit 1; }
trace 'Running grunt now ..';
commander grunt &
}

user_instructions(){
commander npm install -g
commander npm link
commander env
commander mean status
commander grunt_stuff
}

test_navigation(){
while true; do  curl $address 2>/dev/null && break ; sleep 1 ; done
}

test_mean_init(){
echo -e '\n' |  mean init myApp
cd myApp
user_instructions
test_navigation
cd $dir_root
}

tests(){
test_self
test_mean_init
}

navigation(){
( bash -c $file_capture )
}

steps(){
set_env
tests
navigation
}

steps
