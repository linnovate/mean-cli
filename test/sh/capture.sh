set -u 
set -e

set_env1(){
export PATH="$PATH:/usr/games/"
export dir_product=/tmp/session
export dir_artifacts=${CIRCLE_ARTIFACTS:-$HOME}
}



apt1(){
commander sudo apt-get -y -q update
#libnotify-bin firefox 
#imagemagick
#cp: https://github.com/brownman/install_config_test/blob/master/install/apt.sh
while read line;do
commander "sudo apt-get install -y -q ${line}"
done <<START
graphicsmagick
firefox
xcowsay
xvfb
x11-utils
x11-apps
dbus-x11 
START
commander npm install -g image-to-ascii
ensure_npm
ensure_apt
}

print_single(){
local file=$1
cd  $(npm -g root)/image-to-ascii/; 
cp $file test/octocat.png
npm test
}

print_many(){
local file
local list_png=$( ls -1 $dir_product/*.png )
for item in $list_png;do
file=$item
test -f $file && { print_single $file; } || { trace ERR file not found: $file; exit 1; }
done
}

capture_single(){
local file="$dir_product/session_$(date +%s).png"
commander "import -window root $file"
}
capture_many(){
while true;do
capture_single
sleep 1
done
}

debug_screen(){
#commander xwininfo -root -tree
firefox $address &
xcowsay -t 3  "x11 test" &
}


steps(){
set_env1
ensure_dir

apt1

debug_screen
capture_many &
sleep 5
print_many
cp $dir_product/*.png $dir_artifacts
}

steps
