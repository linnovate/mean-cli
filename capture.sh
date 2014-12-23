#!/usr/bin/env bash
set -u 
#set -e

config1(){
export dir_product=/tmp/session
export dir_artifacts=${CIRCLE_ARTIFACTS:-$HOME/tmp}
}

apt1(){  
#firefox

sudo apt-get install -y -q <<START
imagemagick
xvfb
x11-utils
x11-apps
dbus-x11  
xcowsay
libnotify-bin
START
}

capture1(){
  local file
  
  while true;do
  file="$dir_product/session_$(date +%s).png"
  eval "import -window root $file"
  sleep 1
  done
}

debug_screen(){
xwininfo -root -tree
capture1 &
/usr/games/xcowsay -t 3  "x11 test" &
#firefox &
}


steps(){
  config1
  apt1
  debug_screen
  cp $dir_product/* $dir_artifact
}

steps
