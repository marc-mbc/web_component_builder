'use strict';

module.exports = function (config) {
	var web_component_name = config.name;
	var root_folder = config.root;
	var subfolder = config.subfolder;
	var tools = {
	  gulp: require('gulp'),
	  jshint: require('gulp-jshint'),
	  browserify: require('browserify'),
	  rimraf: require('rimraf'),
	  sass: require('gulp-sass'),
	  uglify: require('gulp-uglify'),
	  minifyCSS: require('gulp-minify-css'),
	  rename: require('gulp-rename'),
	  source: require('vinyl-source-stream'),
	  streamify: require('gulp-streamify'),
	  minifyHTML: require('gulp-minify-html'),
	  imagemin: require('gulp-imagemin'),
	  pngquant: require('imagemin-pngquant'),
	  autoprefixer: require('gulp-autoprefixer'),
	  livereload: require('gulp-livereload')
	};

	tools.gulp.task('clean_indexes', function (cb) {
	  tools.rimraf(root_folder + subfolder, cb);
	});

	tools.gulp.task('clean_views', function (cb) {
	  tools.rimraf(root_folder + '/views/' + subfolder, cb);
	});

	tools.gulp.task('clean_js', function (cb) {
	  tools.rimraf(root_folder + '/js/' + subfolder, cb);
	});

	tools.gulp.task('clean_css', function (cb) {
	  tools.rimraf(root_folder + '/css/' + subfolder, cb);
	});

	tools.gulp.task('clean_img', function (cb) {
	  tools.rimraf(root_folder + '/img/' + subfolder, cb);
	});

	// JSHint task
	tools.gulp.task('lint', function() {
	  tools.gulp.src('app/scripts/*.js, !app/scripts/**/*.min.js')
	  .pipe(tools.jshint())
	  .pipe(tools.jshint.reporter('default'));
	});

	// Styles task
	tools.gulp.task('styles', ['clean_css'], function() {

	  tools.gulp.src('app/styles/main.scss')
	    // The onerror handler prevents Gulp from crashing when you make a mistake in your SASS
	    .pipe(tools.sass({onError: function(e) { console.log(e); } }))
	    // Optionally add autoprefixer
	    .pipe(tools.autoprefixer('last 2 versions', '> 1%', 'ie 8'))
	    .pipe(tools.rename(web_component_name + '.css'))
	    // These last two should look familiar now :)
	    .pipe(tools.gulp.dest(root_folder + '/css/' + subfolder))
	    .pipe(tools.rename(web_component_name + '.min.css'))
	    .pipe(tools.minifyCSS())
	    // These last two should look familiar now :)
	    .pipe(tools.gulp.dest(root_folder + '/css/' + subfolder));
	});

	// Browserify task
	tools.gulp.task('browserify', ['clean_js', 'lint'], function (cb) {


	  var bundle = tools.browserify('./app/scripts/main.js')
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
	tools.gulp.task('html', ['clean_views', 'clean_indexes'], function() {

	  // Get our index.html
	  tools.gulp.src('app/index.html')
	  // And put it in the root folder
	  .pipe(tools.gulp.dest(root_folder + '/' + subfolder));

	  tools.gulp.src('app/index.min.html')
	  // And put it in the root folder
	  .pipe(tools.gulp.dest(root_folder + '/' + subfolder));

	  // Any other view files from app/views
	  tools.gulp.src('app/views/**/*.html')
	    .pipe(tools.minifyHTML({
	      empty: true,
	      conditionals: true
	    }))
	    // Will be put in the root/views folder
	    .pipe(tools.gulp.dest(root_folder + '/views/' + subfolder));
	});

	tools.gulp.task('images', ['clean_img'], function () {

	    tools.gulp.src('app/images/*')
	      .pipe(tools.imagemin({
	          progressive: true,
	          svgoPlugins: [{removeViewBox: false}],
	          use: [tools.pngquant()]
	      }))
	      .pipe(tools.gulp.dest(root_folder + '/img/' + subfolder));
	});

	// Dev task
	tools.gulp.task('dev', ['html', 'images', 'styles', 'browserify'], function (cb) {
	  cb();
	});

	// Clean task
	tools.gulp.task('clean', ['clean_indexes', 'clean_views', 'clean_js', 'clean_css', 'clean_img'], function (cb) {
	  cb();
	});

	tools.gulp.task('watch', ['dev'], function() {
	  // Start webserver
	  // server.listen(serverport);
	  // Start live reload
	  tools.livereload.listen();

	  // Watch our scripts, and when they change run lint and browserify
	  tools.gulp.watch(['app/scripts/*.js', 'app/scripts/**/*.js', ', !app/scripts/**/*.min.js'],[
	    'browserify'
	  ]);
	  // Watch our sass files
	  tools.gulp.watch(['app/styles/**/*.scss'], [
	    'styles'
	  ]);

	  tools.gulp.watch(['app/views/**/*.html'], [
	    'html'
	  ]);

	  tools.gulp.watch(['app/images/**/*.html'], [
	    'images'
	  ]);

	  tools.gulp.watch(root_folder + '/' + subfolder + '/**').on('change', tools.livereload.changed);
	  tools.gulp.watch(root_folder + '/js/' + subfolder + '/**').on('change', tools.livereload.changed);
	  tools.gulp.watch(root_folder + '/css/' + subfolder + '/**').on('change', tools.livereload.changed);
	  tools.gulp.watch(root_folder + '/img/' + subfolder + '/**').on('change', tools.livereload.changed);
	  tools.gulp.watch(root_folder + '/views/' + subfolder + '/**').on('change', tools.livereload.changed);

	});
  return tools;
};

