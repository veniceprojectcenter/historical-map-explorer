var _im = require('imagemagick');
var _fs = require('fs');
var _mkdirp = require('mkdirp');
var when = require('when');
var nodefn = require('when/node');
var path = require('path');

var ZOOM_OFFSET = 2;

// This takes an object and transforms all of its methods from
// nodejs callback style to promise style
var im = nodefn.liftAll(_im);
var fs = nodefn.liftAll(_fs);
var mkdirp = nodefn.lift(_mkdirp);

var filenames = process.argv.slice(2);

// I used reduce instead of forEach so it will be synchronous, because even on
// one input it runs around 5 or 6 imagemagick instances, and multiplying that
// will cripple almost any computer.
var x = when.reduce(filenames, function(prevPromise, filename, i) {
	console.log("Processing", i+1, "of", filenames.length, ":", filename);

	var newdirname = filename.replace( path.extname(filename), '' );

	return fs.mkdir(newdirname).tap(function() {
		console.log("Directory created");
	}).catch(function() {
		console.log("Directory already exists");
	}).then(function() {
		return im.identify(filename);
	}).then(function(features) {
		console.log("Starting conversion");
		var conversions = [];
		
		// Size is the larger dimension
		var size = Math.max(features.width, features.height);
		var zoomLevels = Math.floor(Math.log(size/256)/Math.log(2)); // Log base 2 of size/256
				
		for (var i = 0; size > 256; i++, size = size / 2) {
			var factor = Math.pow(2, i);
			var numRows = Math.floor(features.height/(256 * factor) );
			var paddedW = Math.ceil(features.width/(256 * factor)) * 256;
			var paddedH = Math.ceil(features.height/(256 * factor)) * 256;
			var cmd = [filename, '-background', 'none', '-gravity', 'southwest', '-resize', 100/factor + '%', '-extent', paddedW+'x'+paddedH+'!', '+repage', '-crop', '256x256', '-set', 'filename:tile', (zoomLevels-i+ZOOM_OFFSET)+'_%[fx:page.x/256]_%[fx:'+numRows+'-(page.y/256)]', '+repage', '-extent', '256x256', newdirname+'/%[filename:tile].png'];
			conversions.push(im.convert(cmd));
		}
		
		return when.all(conversions);
	}).then(function() {
		console.log("Conversion finished");
		return fs.readdir(newdirname);
	}).then(function(files) {
		var newfiles = files.map(function(n) {
			return path.join(newdirname, n.replace(/_/g, '/'));
		});
		
		return when.all(newfiles.map(function(file) {
			return mkdirp( path.dirname(file) );
		})).then(function() {
			return when.all(files.map(function(file, i) {
				var oldfile = path.join(newdirname, file);
				return fs.rename(oldfile, newfiles[i]);
			}));
		});
	}).then(function () {
		console.log("Done!");
	});

}, when.resolve(true));