'use strict';

/**
 * @ngdoc service
 * @name stankApp.main.factory
 * @description
 * # main.factory
 * Factory in the stankApp.
 */
angular.module('stank')
  .factory('TankGame', function () {
    return TankGame.GameState;
  });
