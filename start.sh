#!/bin/bash
set -u




commander () 
{ 
    local args=($@);
    local cmd="${args[@]}";
    echo "[CMD] $cmd";
    eval "$cmd"
}
export -f commander

trace(){
	echo 1>&2 $@
}

export -f commander
export -f trace


set_env(){
export PATH="$PATH:/usr/games/"
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
}

tests(){
test_self
test_mean_init
}
capture1(){
chmod +x ./capture.sh
bash -E ./capture.sh #trap_err on subshell
}

steps(){
set_env
( set -e; capture1 )
#tests
}

steps