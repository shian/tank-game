'use strict';

var gulp = require('gulp');
var ts = require('gulp-typescript');
var browserSync = require('browser-sync');

var $ = require('gulp-load-plugins')();

module.exports = function(options) {
  gulp.task('scripts', ['ts'], function () {
    return gulp.src(options.src + '/app/**/*.js')
      .pipe($.jshint())
      .pipe($.jshint.reporter('jshint-stylish'))
      .pipe(browserSync.reload({ stream: true }))
      .pipe($.size());
  });

  gulp.task('ts', function(){
    return gulp.src('src/!**!/!*.ts')
      .pipe(ts({
        noImplicitAny: true
      }));
  });
};

