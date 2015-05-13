var gulp         = require('gulp'),
    sass         = require('gulp-sass'),
    minifyCss    = require('gulp-minify-css'),
    rename       = require('gulp-rename'),
    util         = require('gulp-util'),
    useref       = require('gulp-useref'),
    gulpif       = require('gulp-if'),
    uglify       = require('gulp-uglify'),
    rename       = require("gulp-rename"),
    taskListing  = require('gulp-task-listing'),
    nodemon      = require('gulp-nodemon'),
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
gulp.task('assets-dist', function() {
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

// reload and rebuild from source directory
gulp.task('watch', function() {
  gulp.watch('./src/scss/*.scss', ['sass']);
  gulp.watch('./src/*.html', notifyLiveReload);
  gulp.watch('./src/js/*.js', notifyLiveReload);
  gulp.watch('./src/css/*.css', notifyLiveReload);
});

// test dist directory
gulp.task('preview', function() {
  var express = require('express'),
      app     = express(),
      dirname = __dirname + '/dist';
  app.use(express.static(dirname));
  util.log('Serving directory', util.colors.magenta(dirname), 'on', util.colors.magenta('http://127.0.0.1:3033'));
  app.listen(3033);
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

// run install pipeline to dist directory (prepare for deployment)
gulp.task('dist', ['sass', 'assets', 'assets-dist', 'html'], function() {});

// default, run dev server with live reload / rebuild
gulp.task('default', ['serve', 'sass', 'livereload', 'watch', 'assets'], function() {});
