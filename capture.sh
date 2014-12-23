#!/usr/bin/env bash
set -u 
set -e
set -x


set_env1(){
export dir_product=/tmp/session
export dir_artifacts=${CIRCLE_ARTIFACTS:-$HOME}
}
ensure1(){
test -d $dir_product || { mkdir -p $dir_product; }
}
apt0(){
sudo apt-get install -y -q <<START
xcowsay  libnotify-bin imagemagick
xvfb x11-utils x11-apps dbus-x11  
START
}

apt1(){  
#firefox
commander sudo apt-get -y update
npm install -g image-to-ascii
commander sudo apt-get -y -q install firefox graphicsmagick imagemagick xvfb x11-utils x11-apps   dbus-x11  xcowsay   libnotify-bin graphicsmagick
sudo apt-get update --fix-broken
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
firefox &
}

ensure_apt(){
commander which xcowsay 
commander whereis xcowsay 
}

steps(){
  set_env1
  ensure1
  #apt0
  apt1
  ensure_apt
  
  debug_screen
  capture2 &
  sleep 5
  cp $dir_product/*.png $dir_artifacts
}

steps
