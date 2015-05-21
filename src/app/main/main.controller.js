'use strict';

angular.module('stank')
  .controller('MainCtrl', function ($scope, TankGame) {
    $scope.game = new TankGame('game-view');
  });
