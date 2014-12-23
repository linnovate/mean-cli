#!/usr/bin/env bash
set -u 
#set -e

config1(){
export file_product_cover=/tmp/session
}

apt1(){
sudo apt-cache search firefox
  
sudo apt-get install -y -q <<START
firefox
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
  file="/tmp/session/$(date +%s).png"
  eval "import -window root $file"
  sleep 1
  done
}

debug_screen(){
xwininfo -root -tree
capture1 &
xcowsay -t 3  "x11 test" &
firefox &
}


steps(){
  config1
  apt1
  debug_screen
}

steps
