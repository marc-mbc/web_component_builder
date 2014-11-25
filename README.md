## Budgetplaces Web component builder

This module exports a common set of tools and gulp tasks to build a web_component. You can use it for example:

'use strict';

var wc_name = require('path').basename(__dirname);
var tools = require('./tool.js')({
  name: wc_name,
  root: '../../../public/assets',
  subfolder: 'wc_dist/' + wc_name
});
// Add any extra tasks
tools.gulp.task('default', ['watch']);

    
