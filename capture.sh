#!/usr/bin/env bash
set -u 


set_env1(){
export dir_product=/tmp/session
export dir_artifacts=${CIRCLE_ARTIFACTS:-$HOME}
}
ensure1(){
test -d $dir_product || { mkdir -p $dir_product; }
}
apt0(){
#cp: https://github.com/brownman/install_config_test/blob/master/install/apt.sh
while read line;do
commander "sudo apt-get install -y -q ${line}"
done <<START
xcowsay
xvfb
x11-utils
x11-apps
dbus-x11 
START
#imagemagick
}

print_single(){
local file=$1
local variable=$(cat <<SETVAR
require("image-to-ascii")("$file", function (err, result) {
    console.log(err || result);
});
SETVAR
)
commander node "$variable"
}

print_many(){
  local list_png=$( ls -1 $dir_product/*.png )
    for item in $list_png;do
    file=$dir_product/$item
    test -f $file
    print_single $file
    done


}

apt1(){  
#firefox
commander sudo apt-get -y -q update
#commander sudo apt-get -y upgrade

npm install -g image-to-ascii

commander sudo apt-get install -y -q xvfb x11-utils x11-apps dbus-x11 
commander sudo apt-get install -y -q graphicsmagick  
commander sudo apt-get install -y -q xcowsay imagemagick
#libnotify-bin firefox 
}


capture1(){
  local file="$dir_product/session_$(date +%s).png"
  commander "import -window root $file"
}
capture2(){
  local file
  
  while true;do
  file="$dir_product/session_$(date +%s).png"
  eval "import -window root $file"
  sleep 1
  done
}

debug_screen(){
#commander xwininfo -root -tree
/usr/games/xcowsay -t 3  "x11 test" &
#firefox &
}

ensure_apt(){
commander which xcowsay 
commander whereis xcowsay 
}

steps(){
  set_env1
  ensure1
  
  #apt1
  apt0
  ensure_apt
  
  debug_screen
  capture1 &
  sleep 5
  print_many
  cp $dir_product/*.png $dir_artifacts
}

steps
