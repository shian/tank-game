'use strict';

angular.module('stank')
  .controller('MainCtrl', function ($scope, $log, pouchDB, TankGame) {

    function bindAll(allDocs) {
      for (var i = 0; i < allDocs.rows.length; i++) {
        var doc = allDocs.rows[i].doc;
        $log.info(doc);

        TankGame.addEnemy(doc);
      }
    }

    $scope.enemies = TankGame.enemies;

    $scope.game_init = function (game) {
      var db = pouchDB('dbname');
      $scope.remote = "https://achadmainttandurequityfo:GsgQBYGYc4BuwmUreIhW5mW0@shian.cloudant.com/tankgame";
      var opts = {live: true};

      db.replicate.from($scope.remote, opts, function (response) {
        $log.info(response);
      }).on('change', function (info) {
        $log.info("DB Change: ", info);
        db.allDocs({include_docs: true})
          .then(bindAll);
      }).on('active', function () {
        $log.info("DB active");
      }).on('paused', function (err) {
        $log.info("DB pause");
      });

      /* get data */
      db.allDocs({include_docs: true})
        .then(bindAll);

      /* init game state */
      $scope.game = game;
      $scope.game.state.add('main', TankGame.init(game));
      //console.log($scope.game.state.checkState('test'));
      $scope.game.state.start('main', true, true);
    };

  });
