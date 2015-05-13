var gulp         = require('gulp'),
    sass         = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss    = require('gulp-minify-css'),
    rename       = require('gulp-rename'),
    util         = require('gulp-util'),
    morgan       = require('morgan'),
    tinylr;

function notifyLiveReload(event) {
  var fileName = require('path').relative(__dirname + '/public', event.path);
  tinylr.changed({
    body: {
      files: [fileName]
    }
  });
}

gulp.task('livereload', function() {
    tinylr = require('tiny-lr')();
    tinylr.listen(3002);
});

gulp.task('sass', function () {
    gulp.src(['./src/scss/*.scss'])
    .pipe(sass({ style: 'expanded' }).on('error', sass.logError))
    //.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
    //.pipe(rename({suffix: '.min'}))
    //.pipe(minifycss())
    .pipe(gulp.dest('./public/css'));
});

gulp.task('assets', function() {
  gulp.src('lib/vendor/**/*.js')
    .pipe(gulp.dest('public/js/vendor'));
  gulp.src('lib/vendor/**/*.css')
    .pipe(gulp.dest('public/css/vendor'));
});

gulp.task('watch', function() {
  gulp.watch('./src/scss/*.scss', ['sass']);
  gulp.watch('./public/*.html', notifyLiveReload);
  gulp.watch('./public/css/*.css', notifyLiveReload);
});

gulp.task('serve', function() {
  var express = require('express');
  var app = express();
  app.use(morgan('combined'));
  app.use(require('connect-livereload')({port: 3002}));
  app.use(express.static(__dirname + '/public'));
  app.listen(3000);
  util.log('Server listening on', util.colors.magenta('http://127.0.0.1:3000'));
});

gulp.task('default', ['serve', 'livereload', 'watch', 'assets'], function() {});
