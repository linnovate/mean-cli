#!/usr/bin/env bash
set -u 
#set -e

config1(){
export file_product_cover=/tmp/session.png
}

apt1(){
#apt-get install -y -q 

sudo dpkg -L <<START
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
  eval "import -window root $file_product_cover"
}

debug_screen(){
xwininfo -root -tree
xcowsay -t 3  "x11 test" &
sleep 1
capture1
}


steps(){
  config1
  apt1
  debug_screen
}

steps
