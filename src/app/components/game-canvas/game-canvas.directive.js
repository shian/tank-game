'use strict';

angular.module('stank.game', [])
  .directive('gameCanvas', function ($injector) {
    var linkFn = function (scope, ele, attrs) {
      console.log("linkFn");

      scope.game = new Phaser.Game(scope.width, scope.height, Phaser.AUTO, 'game-canvas');
      //console.log(scope.game);

      console.log("game engine create");
      scope.onInit({game: scope.game});
    };

    return {
      scope: {
        onInit: "&",
        width: "=",
        height: "="
      },
      restrict: 'E',
      template: '<div id="game-canvas" style="height: 100vh;overflow: hidden"></div>',
      link: linkFn
    }
  });
