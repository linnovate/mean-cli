'use strict';
var _ = require('lodash');

//helper functions
function extractNames (v) {
  return v.name;
}

function get_get (roles,v) {
  return v.get(roles);
};

function remove_nulls (v) {
  return v;
}

//MenuItem class
function MenuItem (options) {
  options = _.assign ({name: null, title:null, link:null, roles:null}, options);
  if (!options.name) options.name = options.link;
  this.name = options.name;
  this.title = options.title;
  this.link = options.link;
  this.roles = options.roles;
  this.submenus = options.submenus || [];
}

function mapDoStrip (v) {
  return v ? v.strip() : undefined;
}

MenuItem.prototype.strip = function () {
  return {
    name: this.name, 
    title:this.title,
    link: this.link,
    roles:this.roles,
    submenus: this.submenus.map(mapDoStrip)
  };
}


MenuItem.hasRole = function (role, roles) {
  return (roles.indexOf(role) > -1);
}

MenuItem.prototype.props = function () {
  return {
    name: this.name,
    title:this.title,
    link:this.link,
    roles:this.roles
  };
}

MenuItem.prototype.findOrCreate = function (path) {
  if (!path.length) return this;
  var p = path.shift();
  var index = this.list().indexOf(p);
  if (index > -1) return this.submenus[index].findOrCreate(path);
  var n = new MenuItem();
  n.name = p;
  this.submenus.push (n);
  return n.findOrCreate(path);
}

MenuItem.prototype.list = function () {
  return this.submenus.map(extractNames);
}

MenuItem.prototype.get = function (roles, path) {
  roles = roles ? roles.slice() : [];
  if (roles.indexOf('anonymous') < 0 && roles.indexOf('authenticated') < 0) {
    roles.push ('authenticated');
  }

  var list = this.list();
  if (path) {
    if (!path.length) return this;
    var n = path.shift();
    var index = list.indexOf (n);
    return this.submenus[index] ? this.submenus[index].get(roles,path) : undefined;
  }

  if(!MenuItem.hasRole('admin', roles)) {
    if ( this.roles) {
      if (!_.intersection(this.roles, roles).length) return undefined;
    }
  }

  return new MenuItem ({
    roles: this.roles || null,
    link : this.link || null,
    title:this.title || null,
    name : this.name || null,
    submenus : this.submenus.map(get_get.bind(null, roles)).filter(remove_nulls),
  });
}

MenuItem.prototype.add = function (mi) {
  var index = this.list().indexOf(mi.name);
  var itm;
  if (index > -1) {
    var ts = mi.props();
    itm = this.submenus[index];
    for (var i in ts) itm[i] = ts[i];
  }else{
    itm = mi;
    this.submenus.push (itm);
  }
  return itm;
}

var allMenus = new MenuItem (),
  _ = require('lodash');

function mapSubmenuNames (v) {
  return v.name;
}

function supportMenus(Meanio){
  function Menus() {
  };

  Menus.prototype.add = function(options) {
    if (options instanceof Array) {
      options.forEach( Menus.prototype.add.bind(this) );
      return this;
    };

    options = _.assign({
      path : 'main', 
      roles: ['anonymous'],
    },
    options);
    options.path = options.path.replace(/^\//, '');
    var item = allMenus.findOrCreate(options.path.split('/'));
    item.add(new MenuItem(options));
    return this;
  };

  Menus.prototype.get = function(options) {
    options = options || {};
    options.menu = options.menu || 'main';
    options.roles = options.roles || ['anonymous'];
    options.defaultMenu = options.defaultMenu || [];

    var sm = allMenus.get(options.roles, options.menu.split('/'));
    if (!sm) {
      //no menu at all
      return options.defaultMenu;
    }
    var ret = sm.get(options.roles);
    return ret ? options.defaultMenu.concat(ret.submenus.map(mapDoStrip)) : options.defaultMenu; 
/*


    var items = options.defaultMenu.concat(allMenus[options.menu] || []);
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
    //console.log('getting menu for',options,'=>',allowed);
    return allowed;
    */
  };
  Meanio.prototype.Menus =  Menus;

};

module.exports = supportMenus;
