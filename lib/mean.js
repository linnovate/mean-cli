'use strict';

var swig = require('swig');
var container = require('dependable').container();
var fs = require('fs');
var path = require('path');

var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();
var modules = [];
var menus, config, configPath;
var allMenus = [];
var middleware = {
	before: {},
	after: {}
};
var aggregated = {
	js: '',
	css: ''
};

var Mean;

function Meanio() {
	if (this.active) return;
	this.events = events;
	this.version = require('../package').version;
	Mean = this;
}

Meanio.prototype.app = function(name, options, callback) {
	
	if (this.active) return this;

	// Register database dependency
	this.register('database', {
		connection: options.database
	});

	this.name = name;
	this.active = true;

	menus = new this.Menus();
	this.menus = menus;

	this.config = new Config(options.config, function(err, data) {

		if (err) {
			console.log(err);
		}

		findModules();
		enableModules();
		aggregate('js', null);

		return (callback ? callback(data) : data);
	});

	Mean = this;
};

Meanio.prototype.status = function() {
	return {
		active: this.active,
		name: this.name
	};
};

Meanio.prototype.register = container.register;

Meanio.prototype.resolve = container.resolve;

//confusing names, need to be refactored asap
Meanio.prototype.load = container.get;

Meanio.prototype.moduleEnabled = function(name) {
	return (modules[name]) ? true : false;
};

Meanio.prototype.modules = (function() {
	return modules;
})();

Meanio.prototype.aggregated = aggregated;

// Similar code to the settings from packages, could refactor config to be a package but the
// order is important so for now we have a little bit of duplicate code here
function Config(path, callback) {

	if (this.config) return this.config;

	configPath = (path ? path : process.cwd() + '/server/config/config');

	loadSettings(this, callback);

	function verbose() {
		return config;
	}

	function update(settings, callback) {
		var Package = loadPackageModel();

		if (!Package) return callback(true, 'failed to load data model');

		Package.findOneAndUpdate({
			name: 'config'
		}, {
			$set: {
				settings: settings,
				updated: new Date()
			}
		}, {
			upsert: true,
			multi: false
		}, function(err, doc) {
			if (err) {
				console.log(err);
				return callback(true, 'Failed to update settings');
			}

			loadSettings(Mean.config, function(err, settings) {});

			return callback(null, doc.settings);
		});
	}

	function loadSettings(Config, callback) {

		var Package = loadPackageModel();

		var defaultConfig = require(configPath);

		if (!Package) return defaultConfig;

		Package.findOne({
			name: 'config'
		}, function(err, doc) {

			var original = JSON.flatten(defaultConfig, {
				default: true
			});

			var saved = JSON.flatten(doc ? doc.settings : defaultConfig, {});

			var merged = mergeConfig(original, saved);

			var clean = JSON.unflatten(merged.clean, {});

			var diff = JSON.unflatten(merged.diff, {});

			Config.verbose = {
				clean: clean,
				diff: diff,
				flat: merged
			};

			Config.clean = clean;
			Config.diff = diff;
			Config.flat = merged;
			callback(err, clean);
		});
	}

	function mergeConfig(original, saved) {

		var clean = {};

		for (var index in saved) {
			clean[index] = saved[index].value;
			if (original[index]) {
				original[index].value = saved[index].value;
			} else {
				original[index] = {
					value: saved[index].value,
				};
			}

			original[index]['default'] = original[index]['default'] || saved[index]['default'];
		}

		return {
			diff: original,
			clean: clean
		};
	}

	function loadPackageModel() {

		var database = container.get('database');
		if (!database || !database.connection) {
			return null;
		}

		if (!database.connection.models.Package) {
			require('../modules/package')(database);
		}

		return database.connection.model('Package');
	}
	
	this.update = update;

}

Meanio.prototype.Menus = function() {
	this.add = function(options) {

		options.menu = options.menu || 'main';
		options.roles = options.roles || ['anonymous'];

		if (allMenus[options.menu]) {
			allMenus[options.menu].push({
				roles: options.roles,
				title: options.title,
				link: options.link,
				icon: options.icon
			});
		} else {
			allMenus[options.menu] = [{
				roles: options.roles,
				title: options.title,
				link: options.link,
				icon: options.icon
			}];
		}
	};

	this.get = function(options) {
		var allowed = [];
		options.menu = options.menu || 'main';
		options.roles = options.roles || ['anonymous'];

		if (!allMenus[options.menu] && !options.defaultMenu) return [];

		var items = options.defaultMenu.concat((allMenus[options.menu] ? allMenus[options.menu] : []));

		items.forEach(function(item) {

			var hasRole = false;
			options.roles.forEach(function(role) {
				if (role === 'admin' || item.roles.indexOf('anonymous') !== -1 || item.roles.indexOf(role) !== -1) {
					hasRole = true;
				}
			});

			if (hasRole) {
				allowed.push(item);
			}
		});
		return allowed;
	};
};

Meanio.prototype.Module = function(name) {
	this.name = name.toLowerCase();
	this.menus = menus;

	// bootstrap models
	walk(modulePath(this.name, '/server/models'), null, function(model) {
		require(model);
	});

	this.render = function(view, options, callback) {
		swig.renderFile(modulePath(this.name, '/server/views/' + view + '.html'), options, callback);
	};

	// bootstrap routes
	this.routes = function() {
		var args = Array.prototype.slice.call(arguments);
		var that = this;
		walk(modulePath(this.name, '/server/routes'), 'middlewares', function(route) {
			require(route).apply(that, [that].concat(args));
		});
	};

	this.aggregateAsset = function(type, asset, options) {
		aggregate(type, (options && options.absolute ? asset : path.join(modules[this.name].source, this.name, 'public/assets', type, asset)), options);
	};

	this.register = function(callback) {
		container.register(capitaliseFirstLetter(name), callback);
	};

	this.angularDependencies = function(dependencies) {
		this.angularDependencies = dependencies;
		modules[this.name].angularDependencies = dependencies;
	};

	this.settings = function() {

		if (!arguments.length) return;

		var database = container.get('database');
		if (!database || !database.connection) {
			return {
				err: true,
				message: 'No database connection'
			};
		}

		if (!database.connection.models.Package) {
			require('../modules/package')(database);
		}

		var Package = database.connection.model('Package');
		if (arguments.length === 2) return updateSettings(this.name, arguments[0], arguments[1]);
		if (arguments.length === 1 && typeof arguments[0] === 'object') return updateSettings(this.name, arguments[0], function() {});
		if (arguments.length === 1 && typeof arguments[0] === 'function') return getSettings(this.name, arguments[0]);

		function updateSettings(name, settings, callback) {
			Package.findOneAndUpdate({
				name: name
			}, {
				$set: {
					settings: settings,
					updated: new Date()
				}
			}, {
				upsert: true,
				multi: false
			}, function(err, doc) {
				if (err) {
					console.log(err);
					return callback(true, 'Failed to update settings');
				}
				return callback(null, doc);
			});
		}

		function getSettings(name, callback) {
			Package.findOne({
				name: name
			}, function(err, doc) {
				if (err) {
					console.log(err);
					return callback(true, 'Failed to retrieve settings');
				}
				return callback(null, doc);
			});
		}
	};
};

// copied from mean/config/util.js
// potential to merge with functions in aggregate()
function walk(path, excludeDir, callback) {
	if (!fs.existsSync(path)) return;

	fs.readdirSync(path).forEach(function(file) {
		var newPath = path + '/' + file;
		var stat = fs.statSync(newPath);
		if (stat.isFile() && /(.*)\.(js|coffee)$/.test(file)) {
			callback(newPath);
		} else if (stat.isDirectory() && file !== excludeDir) {
			walk(newPath, excludeDir, callback);
		}
	});

}

function capitaliseFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function modulePath(name, plus) {
	return path.join(process.cwd(), modules[name].source, name, plus);
}

function findModules() {

	function searchSource(source, callback) {
		fs.readdir(path.join(process.cwd(), source), function(err, files) {
			if (err || !files || !files.length) {
				if (err && err.code !== 'ENOENT') console.log(err);
				return callback();
			}
			files.forEach(function(file, index) {
				fs.readFile(path.join(process.cwd(), source, file, 'package.json'), function(fileErr, data) {
					if (err) throw fileErr;
					if (data) {
						try {
							var json = JSON.parse(data.toString());
							if (json.mean) {
								modules[json.name] = {
									version: json.version,
									source: source,
									description:json.description,
									author:json.author.name
								};
							}
						} catch (err) {
							return callback();
						}
					}
					if (files.length - 1 === index) return callback();
				});
			});
		});
	}

	var sources = 2;

	function searchDone() {
		sources--;
		if (!sources) {
			events.emit('modulesFound');
		}
	}
	searchSource('node_modules', searchDone);
	searchSource('packages', searchDone);
}

function enableModules() {
	events.on('modulesFound', function() {

		var name;
		for (name in modules) {
			require(path.join(process.cwd(), modules[name].source, name, 'app.js'));
		}

		for (name in modules) {
			name = capitaliseFirstLetter(name);
			container.resolve.apply(this, [name]);
			container.get(name);
		}

		return modules;
	});
}

//will do compression and mingify/uglify soon
function aggregate(ext, aggPath, options) {
	options = options || {};

	//Allow libs
	var libs = true;
	if (aggPath) return readFile(ext, path.join(process.cwd(), aggPath));

	//this redoes all the aggregation for the extention type
	aggregated[ext] = '';

	//Deny Libs
	libs = false;
	events.on('modulesFound', function() {
		for (var name in modules) {
			readFiles(ext, path.join(process.cwd(), modules[name].source, name, 'public'));
		}
	});

	function readFiles(ext, filepath) {
		fs.readdir(filepath, function(err, files) {
			if (err) return;
			files.forEach(function(file) {
				if (!libs && file !== 'assets') {
					readFile(ext, path.join(filepath, file));
				}
			});
		});
	}

	function readFile(ext, filepath) {
		fs.readdir(filepath, function(err, files) {
			if (files) return readFiles(ext, filepath);
			if (path.extname(filepath) !== '.' + ext) return;
			fs.readFile(filepath, function(fileErr, data) {
				//add some exists and refactor
				//if (fileErr) console.log(fileErr)

				if (!data) {
					readFiles(ext, filepath);
				} else {
					aggregated[ext] += (ext === 'js' && !options.global) ? ('(function(){' + data.toString() + '})();') : data.toString() + '\n';
				}
			});
		});
	}
}

Meanio.prototype.chainware = {

	add: function(event, weight, func) {
		middleware[event].splice(weight, 0, {
			weight: weight,
			func: func
		});
		middleware[event].join();
		middleware[event].sort(function(a, b) {
			if (a.weight < b.weight) {
				a.next = b.func;
			} else {
				b.next = a.func;
			}
			return (a.weight - b.weight);
		});
	},

	before: function(req, res, next) {
		if (!middleware.before.length) return next();
		this.chain('before', 0, req, res, next);
	},

	after: function(req, res, next) {
		if (!middleware.after.length) return next();
		this.chain('after', 0, req, res, next);
	},

	chain: function(operator, index, req, res, next) {
		var args = [req, res,
			function() {
				if (middleware[operator][index + 1]) {
					this.chain('before', index + 1, req, res, next);
				} else {
					next();
				}
			}
		];

		middleware[operator][index].func.apply(this, args);
	}
};



JSON.flatten = function(data, options) {
	var result = {};
	flatten(data, '');

	function flatten(config, root) {
		for (var index in config) {
			if (config[index] && !config[index].value && typeof(config[index]) === 'object') {
				flatten(config[index], layerRoot(root, index));
			} else {
				result[layerRoot(root, index)] = {
					'value': config[index]
				};

				if (options['default']) {
					result[layerRoot(root, index)]['default'] = config[index];
				}

			}
		}
	}

	function layerRoot(root, layer) {
		return (root ? root + '.' : root) + layer;
	}
	return result;
};

JSON.unflatten = function(data) {
	if (Object(data) !== data || Array.isArray(data))
		return data;
	var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
		resultholder = {};
	for (var p in data) {
		var cur = resultholder,
			prop = '',
			m;
		while (m = regex.exec(p)) {
			cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
			prop = m[2] || m[1];
		}
		cur[prop] = data[p];
	}
	return resultholder[''] || resultholder;
};


module.exports = exports = new Meanio();
