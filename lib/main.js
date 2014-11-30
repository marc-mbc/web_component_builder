'use strict';

module.exports = function (config) {
  var web_component_name = config.name;
  var web_component_root = config.web_component_root;
  var root_folder = config.main_root + config.dist_path;
  var subfolder = config.subfolder;
  var dependences = config.dependences;
  var css_lint_file = config.css_lint_config || '';
  var tools, dependence_root;

  // Load all html and images to the public folder
  if (dependences) {
    for (var i = dependences.length - 1; i >= 0; i--) {
      dependence_root = web_component_root + '/node_modules/' + dependences[i];
      tools = require(dependence_root + '/component_build.js')({
        wc_name: dependences[i],
        root: dependence_root,
        tools: tools,
        main_root: config.main_root
      });
      tools.all_dependences['html_' + dependences[i]] = true;
      tools.all_dependences['images_' + dependences[i]] = true;
    }
  }

  if (!tools || Object.keys(tools).length === 0) {
    tools = config.tools;
    if (!tools || Object.keys(tools).length === 0) {
      tools = {
        gulp: require('gulp'),
        jshint: require('gulp-jshint'),
        browserify: require('browserify'),
        rimraf: require('rimraf'),
        sass: require('gulp-ruby-sass'),
        uncss: require('gulp-uncss'),
        scsslint: require('gulp-scss-lint'),
        sourcemaps: require('gulp-sourcemaps'),
        minifyCSS: require('gulp-minify-css'),
        uglify: require('gulp-uglify'),
        rename: require('gulp-rename'),
        source: require('vinyl-source-stream'),
        streamify: require('gulp-streamify'),
        minifyHTML: require('gulp-minify-html'),
        imagemin: require('gulp-imagemin'),
        pngquant: require('imagemin-pngquant'),
        svgstore: require('gulp-svgstore'),
        glob: require('glob'),
        cache: require('gulp-cached'),
        svgmin: require('gulp-svgmin'),
        connect: require('connect'),
        serveStatic: require('serve-static'),
        livereload: require('gulp-livereload'),
        all_dependences: {},
        all_html: []
      };
    }
  }
  
  // Needed to detect unused CSS
  tools.all_html = tools.all_html.concat(tools.glob.sync(web_component_root + '/app/views/**/*.html').concat([web_component_root + '/app/index.min.html', web_component_root + '/app/index.min.html']));

  tools.gulp.task('clean_indexes_' + web_component_name, function (cb) {
    tools.rimraf(root_folder + subfolder, cb);
  });

  tools.gulp.task('clean_views_' + web_component_name, function (cb) {
    tools.rimraf(root_folder + '/views/' + subfolder, cb);
  });

  tools.gulp.task('clean_js_' + web_component_name, function (cb) {
    tools.rimraf(root_folder + '/js/' + subfolder, cb);
  });

  tools.gulp.task('clean_css_' + web_component_name, function (cb) {
    tools.rimraf(root_folder + '/css/' + subfolder, cb);
  });

  tools.gulp.task('clean_img_' + web_component_name, function (cb) {
    tools.rimraf(root_folder + '/img/' + subfolder, cb);
  });

  // JSHint task
  tools.gulp.task('lint_js_' + web_component_name, function() {
    return tools.gulp.src(web_component_root + '/app/scripts/**/*.js, !' + web_component_root + '/app/scripts/**/*.min.js')
    .pipe(tools.jshint())
    .pipe(tools.jshint.reporter('default'));
  });

  tools.gulp.task('lint_scss_' + web_component_name, [], function() {
    var css_config = {};
    if (css_lint_file) {
      css_config.config = css_lint_file;
    }
    return tools.gulp.src(web_component_root + '/app/styles/**/*.scss')
      .pipe(tools.cache('scsslint'))
      .pipe(tools.scsslint(css_config));
  });

  // Styles task
  tools.gulp.task('scss_' + web_component_name, ['lint_scss_' + web_component_name], function() {
    return tools.gulp.src(web_component_root + '/app/styles/app.scss')
      .pipe(tools.sourcemaps.init())
      .pipe(tools.sass())
      .pipe(tools.sourcemaps.write(web_component_root + '/app/styles/maps'))
      .pipe(tools.gulp.dest(web_component_root + '/app/styles/css'));
  });

  tools.gulp.task('styles_' + web_component_name, ['clean_css_' + web_component_name, 'scss_' + web_component_name], function() {
    return tools.gulp.src(web_component_root + '/app/styles/css/app.css')
      .pipe(tools.uncss({
        html: tools.all_html
      }))
      .pipe(tools.rename(web_component_name + '.css'))
      // These last two should look familiar now :)
      .pipe(tools.gulp.dest(root_folder + '/css/' + subfolder))
      .pipe(tools.rename(web_component_name + '.min.css'))
      .pipe(tools.minifyCSS())
      // These last two should look familiar now :)
      .pipe(tools.gulp.dest(root_folder + '/css/' + subfolder));
  });

  // Browserify task
  tools.gulp.task('browserify_' + web_component_name, ['clean_js_' + web_component_name, 'lint_js_' + web_component_name], function (cb) {

    var bundle = tools.browserify(web_component_root + '/app/scripts/main.js')
      .bundle()
      .on('error', function (err) {
        console.log(err.toString());
        this.emit('end');
      });
    
    bundle
      .pipe(tools.source(web_component_name + '.js'))
      .pipe(tools.gulp.dest(root_folder + '/js/' + subfolder));
    // minified version
    bundle
      .pipe(tools.source(web_component_name + '.min.js'))
      .pipe(tools.streamify(tools.uglify()))
      .pipe(tools.gulp.dest(root_folder + '/js/' + subfolder));
    cb();
  });


  // Views task
  tools.gulp.task('html_' + web_component_name, ['clean_views_' + web_component_name, 'clean_indexes_' + web_component_name], function() {

    // Get our index.html
    tools.gulp.src(web_component_root + '/app/index.html')
    // And put it in the root folder
    .pipe(tools.gulp.dest(root_folder + '/' + subfolder));

    tools.gulp.src(web_component_root + '/app/index.min.html')
    // And put it in the root folder
    .pipe(tools.gulp.dest(root_folder + '/' + subfolder));

    // Any other view files from app/views
    return tools.gulp.src(web_component_root + '/app/views/**/*.html', { base: web_component_root + '/app/views' })
      .pipe(tools.minifyHTML({
        empty: true,
        conditionals: true
      }))
      // Will be put in the root/views folder
      
      .pipe(tools.gulp.dest(root_folder + '/views/' + subfolder));
  });

  tools.gulp.task('images_' + web_component_name, ['clean_img_' + web_component_name, 'svgstore_' + web_component_name], function () {
    return tools.gulp.src(web_component_root + '/app/images/**/*', { base: web_component_root + '/images' })
      .pipe(tools.imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [tools.pngquant()]
      }))
      .pipe(tools.gulp.dest(root_folder + '/img/' + subfolder));
  });

  tools.gulp.task('svgstore_' + web_component_name, function () {
    return tools.gulp.src(web_component_root + '/app/images/svg/**/*.svg' , { base: web_component_root + '/images/svg' })
      .pipe(tools.svgmin())
      .pipe(tools.svgstore({ fileName: 'icons.svg', prefix: 'icon-' }))
      .pipe(tools.gulp.dest(web_component_root + '/app/images/svg'));
  });

  // Dev task
  tools.gulp.task('dev_' + web_component_name, ['styles_' + web_component_name, 'html_' + web_component_name, 'images_' + web_component_name, 'browserify_' + web_component_name], function (cb) {
    cb();
  });

  // Clean task
  tools.gulp.task('clean_' + web_component_name, ['clean_indexes_' + web_component_name, 'clean_views_' + web_component_name, 'clean_js_' + web_component_name, 'clean_css_' + web_component_name, 'clean_img_' + web_component_name], function (cb) {
    cb();
  });

  tools.gulp.task('watch_' + web_component_name, ['dev_' + web_component_name], function() {
    // Start webserver
    // server.listen(serverport);
    // Start live reload
    tools.livereload.listen();

    // Watch our scripts, and when they change run lint_js and browserify
    tools.gulp.watch([web_component_root + '/app/scripts/**/*.js', ', !' + web_component_root + '/app/scripts/**/*.min.js'],[
      'browserify_' + web_component_name
    ]);
    // Watch our sass files
    tools.gulp.watch([web_component_root + '/app/styles/**/*.scss'], [
      'styles_' + web_component_name
    ]);

    tools.gulp.watch([web_component_root + '/app/views/**/*.html'], [
      'html_' + web_component_name, 'styles_' + web_component_name
    ]);

    tools.gulp.watch([web_component_root + '/app/images/**/*'], [
      'images_' + web_component_name
    ]);

    tools.gulp.watch(root_folder + '/' + subfolder + '/**').on('change', tools.livereload.changed);
    tools.gulp.watch(root_folder + '/js/' + subfolder + '/**').on('change', tools.livereload.changed);
    tools.gulp.watch(root_folder + '/css/' + subfolder + '/**').on('change', tools.livereload.changed);
    tools.gulp.watch(root_folder + '/img/' + subfolder + '/**').on('change', tools.livereload.changed);
    tools.gulp.watch(root_folder + '/views/' + subfolder + '/**').on('change', tools.livereload.changed);

  });
  return tools;
};
