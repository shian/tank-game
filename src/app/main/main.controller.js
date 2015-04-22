'use strict';

angular.module('stank')
  .controller('MainCtrl', function ($scope) {
    $scope.game_init = function (game) {
      $scope.game = game;
      $scope.game.state.add('main', tankMain(game));
      //console.log($scope.game.state.checkState('test'));
      $scope.game.state.start('main', true, true);
    };
  });
