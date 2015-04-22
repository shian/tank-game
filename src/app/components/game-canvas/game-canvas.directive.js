'use strict';

angular.module('stank.game', [])
  .directive('gameCanvas', function ($injector) {
    var linkFn = function (scope, ele, attrs) {
      console.log("linkFn");
      var height  = parseInt(ele.css('height'), 10),
        width   = parseInt(ele.css('width'), 10);
      scope.game = new Phaser.Game(width, height, Phaser.AUTO, 'game-canvas');
      console.log("game engine create");
      scope.onInit({game: scope.game});
    };

    return {
      scope: {
        onInit: "&"
      },
      restrict: 'E',
      template: '<div id="game-canvas"></div>',
      link: linkFn
    }
  });
