/*jslint node: true */
'use strict';

var 
    browserify   = require('browserify'),
    buffer       = require('vinyl-buffer'),
    del          = require('del'),
    gulp         = require('gulp'),
    gulpif       = require('gulp-if'),
    imagemin     = require('gulp-imagemin'),
    jshint       = require('gulp-jshint'),
    karma        = require('karma').server,
    nodemon      = require('gulp-nodemon'),
    rename       = require('gulp-rename'),
    rsync        = require('gulp-rsync'),
    sass         = require('gulp-sass'),
    source       = require('vinyl-source-stream'),
    sourcemaps   = require('gulp-sourcemaps'),
    stylish      = require('jshint-stylish'),
    taskListing  = require('gulp-task-listing'),
    uglify       = require('gulp-uglify'),
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
  .pipe(gulp.dest('./dist/css'));
});

// copy html to dist
gulp.task('html', function () {
  return gulp.src(['src/*.html'])
  .pipe(gulp.dest('dist'));
});

// copy minified vendor libs from source to dist
gulp.task('assets-dist', ['optimize-images-dist'], function() {
  var files = ['src/bower_components/**/*.min.js', 
               'src/bower_components/**/*.min.css',
               '!src/js/**/test/**'];
  gulp.src(files)
  .pipe(gulp.dest('dist/bower_components'));
  var fonts = ([]);
  gulp.src(fonts)
  .pipe(gulp.dest('dist/fonts'));
});

// optimize images when copying to dist
gulp.task('optimize-images-dist', function() {
  return gulp.src('src/img/**/*.{gif,jpg,png,svg,ico}')
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

gulp.task('javascript', function () {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: './src/js/app.js',
    debug: true
  });

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .pipe(uglify())
        .on('error', util.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/js/'));
});

// run dev server
gulp.task('serve', function() {
  var port     = 3000,
      url      = 'http://127.0.0.1:' + port.toString(),
      livePort = 3002,
      docRoot  = 'dist',
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
gulp.task('deploy', function() {
  return gulp.src('dist/**/*.*')
  .pipe(rsync({
    root: 'dist',
    username: 'deploy',
    hostname: '1.2.3.4',
    destination: '/srv/www/site/'
  }));
});

// compile css, copy vendor deps and lint
gulp.task('build', ['sass', 'assets-dist', 'html', 'javascript', 'lint'], function() {});

// default, run dev server with live reload / rebuild
gulp.task('default', ['build', 'livereload', 'watch', 'serve'], function() {});
