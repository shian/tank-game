'use strict';

angular.module('stank.game', [])
  .directive('gameCanvas', function ($injector) {
    var linkFn = function (scope, ele, attrs) {
      console.log("linkFn");
      var height  = parseInt(ele.css('height'), 10),
          width   = parseInt(ele.css('width'), 10);

      var SAFE_ZONE_WIDTH = 320;
      var SAFE_ZONE_HEIGHT = 640;

      var w = window.innerWidth,//* pixelRatio,
          h = window.innerHeight ;//* pixelRatio;
      var lw, lh; //landscape width/height in pixels
      if ( h > w ) {
        lw = h;
        lh = w;
      } else {
        lw = w;
        lh = h;
      }
      var aspectRatioDevice = lw/lh;

      var aspectRatioSafeZone = SAFE_ZONE_WIDTH / SAFE_ZONE_HEIGHT;
      var extraWidth = 0, extraHeight = 0;
      if (aspectRatioSafeZone < aspectRatioDevice) {
        // have to add game pixels horizontally in order to fill the device screen
        extraWidth = aspectRatioDevice * SAFE_ZONE_HEIGHT - SAFE_ZONE_WIDTH;
      } else {
        // have to add game pixels vertically
        extraHeight = SAFE_ZONE_WIDTH / aspectRatioDevice - SAFE_ZONE_HEIGHT;
      }

      scope.game = new Phaser.Game(SAFE_ZONE_WIDTH + extraWidth, SAFE_ZONE_HEIGHT + extraHeight, Phaser.AUTO, 'game-canvas');
      //console.log(scope.game);

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
