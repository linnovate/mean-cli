var meanVersion = require(process.cwd() + '/package.json').version;

if (meanVersion < '0.4.0') {
  console.error('Please upgrade mean to 0.4.0!')
} else {
	//all older versions of mean
	module.exports = require('./lib/mean');
}