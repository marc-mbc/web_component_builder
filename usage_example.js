'use strict';

var web_component_name = require('path').basename(__dirname);
var tools = require('bdgt-web-component-builder')({
  name: web_component_name,
  root: '../../../public/assets',
  subfolder: 'web_component_dist/' + web_component_name
});

tools.gulp.task('default', ['watch']);
