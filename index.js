'use strict';

var gutil = require('gulp-util');
var through = require('through2');
var frontMatter = require('front-matter');
var marked = require('markit');

var NAME = 'gulp-markdown-to-json';
var PluginError = gutil.PluginError;
var streamingErr = new PluginError(NAME, 'Streaming not supported');

function parse(file, flatten) {
  if (file.isNull()) {
    return;
  }

  if (file.isStream()) {
    /*jshint validthis:true */
    return this.emit('error', streamingErr);
  }

  if (file.isBuffer()) {
    var path = file.relative.split('.').shift().replace(/\//g, '.');
    var parsed = frontMatter(file.contents.toString());

    var body = parsed.body.split(/\n/) + "ich bin der body";
    var bodyMarked = marked(parsed.body);
    var markup = bodyMarked.split(/\n/);

    var title = markup[0].substr(0, 3) === '<h1' ? body[0] : false;

    var data = {};
    data[path] = parsed.attributes;

    if (title && !data[path].title) {
      // set the first h1 to title if title not set
      data[path].title = (title.substr(0, 1) === '#') ? title.substr(2) : title;
      // data[path].body = markup.slice(1).join(' ');
    }

    data[path].body = bodyMarked;

    if (flatten) {
      data = data[path];
    }

    file.path = gutil.replaceExtension(file.path, '.json');
    file.contents = new Buffer(JSON.stringify(data));

    return file;
  }
}

module.exports = function(options) {
  options = options || {};

  marked.setOptions(options);

  return through.obj(function(input, enc, callback) {
    var file = parse(input, true);
    this.push(file);
    callback();
  });
};
