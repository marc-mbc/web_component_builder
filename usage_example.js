'use strict';
var wc_name = require('path').basename(__dirname);
var tools = require('./component_build.js')({
  wc_name: wc_name,
  root: __dirname,
  main_root: __dirname
});

// tools has gulp, many tools and all web component tasks (with sufix _{{Web Component Name}}) 
// for this web component and all of his dependences
// Here you can add more tasks if you need


// In this example we want as a default task a watch of the main component. tools.all_dependences is a set
// of tasks that we need to move all images and html of every dependence to the public folder 
tools.gulp.task('default', ['watch_' + wc_name].concat(Object.keys(tools.all_dependences)), function () {
  tools.connect().use(tools.serveStatic(__dirname + '/public')).listen(8080);
});
