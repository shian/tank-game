'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var wrench = require('wrench'); //Recursive filesystem (and other) operations that Node should have.

var options = {
  src: 'src',
  dist: 'dist',
  tmp: '.tmp',
  e2e: 'e2e',
  errorHandler: function (title) {
    return function (err) {
      gutil.log(gutil.colors.red('[' + title + ']'), err.toString());
      this.emit('end');
    };
  },
  wiredep: {
    directory: 'bower_components'
  }
};

// 載入 gulp 目錄下的 .js .coffee 檔案
wrench.readdirSyncRecursive('./gulp').filter(function (file) {
  return (/\.(js|coffee)$/i).test(file);
}).map(function (file) {
  require('./gulp/' + file)(options);
});

// 預設工作
gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
