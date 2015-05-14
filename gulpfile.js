/*jslint node: true */
'use strict';

var del          = require('del'),
    gulp         = require('gulp'),
    gulpif       = require('gulp-if'),
    imagemin     = require('gulp-imagemin'),
    jshint       = require('gulp-jshint'),
    karma        = require('karma').server,
    minifyCss    = require('gulp-minify-css'),
    nodemon      = require('gulp-nodemon'),
    rename       = require('gulp-rename'),
    rsync        = require('gulp-rsync'),
    sass         = require('gulp-sass'),
    stylish      = require('jshint-stylish'),
    taskListing  = require('gulp-task-listing'),
    uglify       = require('gulp-uglify'),
    useref       = require('gulp-useref'),
    util         = require('gulp-util'),
    tinylr;

function notifyLiveReload(event) {
  var fileName = require('path').relative(__dirname + '/dist', event.path);
  tinylr.changed({
    body: {
      files: [fileName]
    }
  });
}

gulp.task('help', taskListing);

gulp.task('clean', function() {
    del(['dist/']);
});

// start livereload
gulp.task('livereload', function() {
  tinylr = require('tiny-lr')();
  tinylr.listen(3002);
});

// compile sass in source directory
gulp.task('sass', function () {
  gulp.src(['./src/scss/*.scss'])
  .pipe(sass({ style: 'expanded' }).on('error', sass.logError))
  .pipe(gulp.dest('./src/css'));
});

// install vendor assets in source directory
gulp.task('assets', function() {
  gulp.src('bower_components/**/*.{js,map}')
  .pipe(gulp.dest('src/js/vendor'));
  gulp.src('bower_components/**/modernizr-*.min.js')
  .pipe(rename(function (path) {
    path.dirname  = 'modernizr';
    path.basename = "modernizr.min";
    path.extname  = ".js";
  }))
  .pipe(gulp.dest('src/js/vendor'));
  gulp.src('bower_components/**/*.{css,map}')
  .pipe(gulp.dest('src/css/vendor'));
});

// minify and concatenate linked assets, fix paths in html and install
// to dist directory
gulp.task('html', function () {
  var assets = useref.assets();
  return gulp.src('src/*.html')
  .pipe(assets)
  .pipe(gulpif('*.js', uglify()))
  .pipe(gulpif('*.css', minifyCss()))
  .pipe(assets.restore())
  .pipe(useref())
  .pipe(gulp.dest('dist'));
});

// copy minified vendor libs from source to dist
gulp.task('assets-dist', ['optimize-images-dist'], function() {
  gulp.src('src/css/vendor/**/*.min.css')
  .pipe(gulp.dest('dist/css/vendor'));
  gulp.src('src/js/vendor/**/modernizr-*.min.js')
  .pipe(rename(function (path) {
    path.dirname  = 'modernizr';
    path.basename = "modernizr.min";
    path.extname  = ".js";
  }))
  .pipe(gulp.dest('dist/js/vendor'));
  gulp.src(['src/js/vendor/**/*.min.js', '!src/js/**/test/**'])
  .pipe(gulp.dest('dist/js/vendor'));
});

// optimize images when copying to dist
gulp.task('optimize-images-dist', function() {
  return gulp.src('src/img/**/*.{gif,jpg,png,svg}')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      optimizationLevel: 3
    }))
    .pipe(gulp.dest('dist/img/'));
});

// reload and rebuild from source directory
gulp.task('watch', function() {
  gulp.watch('./src/scss/*.scss', ['sass']);
  gulp.watch('./src/*.html', notifyLiveReload);
  gulp.watch('./src/js/*.js', notifyLiveReload);
  gulp.watch('./src/css/*.css', notifyLiveReload);
});

// preview dist directory
gulp.task('preview', ['dist'], function() {
  var port     = 3033,
      url      = 'http://127.0.0.1:' + port.toString(),
      livePort = 3002,
      docRoot  = 'dist',
      reload   = '';
  util.log('Serving directory', util.colors.magenta(docRoot), 'on', util.colors.magenta(url));
  nodemon({
    script: 'server.js',
    args: ['--harmony', port.toString(), livePort.toString(), docRoot, reload],
    ext: 'js',
    env: { 'NODE_ENV': 'development' }
  });
});

// run dev server
gulp.task('serve', function() {
  var port     = 3000,
      url      = 'http://127.0.0.1:' + port.toString(),
      livePort = 3002,
      docRoot  = 'src',
      reload   = 'reload';
  util.log('Serving directory', util.colors.magenta(docRoot), 'on', util.colors.magenta(url));
  nodemon({
    script: 'server.js',
    args: ['--harmony', port.toString(), livePort.toString(), docRoot, reload],
    ext: 'js',
    env: { 'NODE_ENV': 'development' }
  });
});

// lint javascript
gulp.task('lint', function() {
  return gulp.src([
      'gulpfile.js',
      'server.js',
      'src/js/*.js'
    ]).pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

// run tests once and exit (for ci)
gulp.task('test', function(done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, function() {
    done();
  });
});

// sync with remote dir
gulp.task('rsync', function() {
  return gulp.src('dist/**/*.*')
  .pipe(rsync({
    root: 'dist',
    username: 'deploy',
    hostname: '1.2.3.4',
    destination: '/srv/www/site/'
  }));
});

// run install pipeline to dist directory (prepare for deployment)
gulp.task('dist', ['sass', 'assets', 'assets-dist', 'html'], function() {});

// compile css, copy vendor deps and lint
gulp.task('build', ['sass', 'assets', 'lint'], function() {});

// default, run dev server with live reload / rebuild
gulp.task('default', ['sass', 'lint', 'livereload', 'watch', 'assets', 'serve'], function() {});
