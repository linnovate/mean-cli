#!/bin/bash

test_self(){
sudo apt-get install -y -q curl
npm install bower
npm install -g
npm link

npm test
}

test_mean_init(){
echo -e '\n' |  mean init myApp
cd myApp
#npm -g install
npm install -g
npm link
grunt test && (
grunt &
while true; do  curl 0.0.0.0:3000 2>/dev/null && break ; sleep 1 ; done
)
}

test_self
test_mean_init
