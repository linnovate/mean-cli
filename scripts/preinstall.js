var spawn = require('child_process').spawn;
    list = spawn('npm', ['ls', '--global', '--parseable', '--depth', '0']),
    grep  = spawn('grep', ['meanio']);

list.stdout.on('data', function (data) {
  grep.stdin.write(data);
});

list.on('close', function (code) {
  grep.stdin.end();
});

grep.stdout.on('data', function (data) {
  console.log('' + data);
});

grep.on('close', function (code) {
  if (code === 0) {
    console.log('  Please run \'npm uninstall -g meanio\' prior to installing mean-cli');
    console.log('');
    process.exit(1);
  }
});
