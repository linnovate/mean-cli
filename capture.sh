set -u 
set -e

set_env1(){
export PATH="$PATH:/usr/games/"
export dir_product=/tmp/session
export dir_artifacts=${CIRCLE_ARTIFACTS:-$HOME}
}

ensure_npm(){
  ls -l $(npm -g root)/image-to-ascii
}
ensure_apt(){
commander which xcowsay 
commander whereis xcowsay 
}
ensure_dir(){
test -d $dir_product || { mkdir -p $dir_product; }
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
}

print_single(){
local file=$1
cat  >/tmp/picture.js <<SETVAR
require("image-to-ascii")("$file", function (err, result) {
console.log(err || result);
});
SETVAR
cat 1>&2 -n /tmp/picture.js
node /tmp/picture.js
}

print_many(){
local file
local list_png=$( ls -1 $dir_product/*.png )
for item in $list_png;do
file=$item
test -f $file && { print_single $file; } || { trace ERR file not found: $file; exit 1; }
done
}

capture1(){
local file="$dir_product/session_$(date +%s).png"
commander "import -window root $file"
}
capture2(){
local file

while true;do
file="$dir_product/session_$(date +%s).png"
commander "import -window root $file"
sleep 1
done
}

debug_screen(){
#commander xwininfo -root -tree
firefox localhost:3000 &
xcowsay -t 3  "x11 test" &
}


steps(){
set_env1
ensure_dir

apt1
ensure_npm
ensure_apt

debug_screen
capture2 &
sleep 5
print_many
cp $dir_product/*.png $dir_artifacts
}

steps
