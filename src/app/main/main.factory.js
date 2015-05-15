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
    var logo;
    var bullets;
    var enemyBullets;
    var land;
    var player; // player
    var explosions;
    var enemiesAlive = 0;
    var cursors;
    var enemies = [];
    var phaser;

    /** Enemy Tank **/
    var EnemyTank = function (game, player, bullets) {
      this.x = game.world.randomX;
      this.y = game.world.randomY;

      this.game = game;
      this.player = player;
      this.bullets = bullets;
      this.health = 3;
      this.fireRate = 1000;
      this.nextFire = 0;
      this.alive = true;

      this.shadow = game.add.sprite(this.x, this.y, 'enemy', 'shadow');
      this.tank = game.add.sprite(this.x, this.y, 'enemy', 'tank1');
      this.turret = game.add.sprite(this.x, this.y, 'enemy', 'turret');

      this.shadow.anchor.set(0.5);
      this.tank.anchor.set(0.5);
      this.tank.name = this.name;
      this.turret.anchor.set(0.3, 0.5);

      game.physics.enable(this.tank, Phaser.Physics.ARCADE);
      this.tank.body.immovable = false;
      this.tank.body.collideWorldBounds = true;
      this.tank.body.bounce.setTo(1, 1);

      this.tank.angle = game.rnd.angle();
      game.physics.arcade.velocityFromRotation(this.tank.rotation, 100, this.tank.body.velocity);
    };

    EnemyTank.prototype.damage = function () {
      this.health -= 1;
      if (this.health <= 0) {
        this.alive = false;
        this.shadow.kill();
        this.tank.kill();
        this.turret.kill();

        return true;
      }
      return false;
    };

    EnemyTank.prototype.update = function () {
      this.x = this.tank.x;
      this.y = this.tank.y;
      this.shadow.x = this.tank.x;
      this.shadow.y = this.tank.y;
      this.shadow.rotation = this.tank.rotation;

      this.turret.x = this.tank.x;
      this.turret.y = this.tank.y;
      this.turret.rotation = this.game.physics.arcade.angleBetween(this.tank, this.player);

      if (this.game.physics.arcade.distanceBetween(this.tank, this.player) < 300) {
        if (this.game.time.now > this.nextFire && this.bullets.countDead() > 0) {
          this.nextFire = this.game.time.now + this.fireRate;
          var bullet = this.bullets.getFirstDead();
          bullet.reset(this.turret.x, this.turret.y);
          bullet.rotation = this.game.physics.arcade.moveToObject(bullet, this.player, 500);
        }
      }
    };

    EnemyTank.prototype.bulletHitEnemy = function (tank, bullet) {
      bullet.kill();
      var destroyed = this.damage();

      if (destroyed) {
          var explosionAnimation = explosions.getFirstExists(false);
          explosionAnimation.reset(this.tank.x, this.tank.y);
          explosionAnimation.play('kaboom', 30, false, true);
      }
    }

    /** 玩家 **/
    var PlayerTank = function(game){
      this.game = game;
      //  The base of our tank
      this.tank = game.add.sprite(0, 0, 'tank', 'tank1');
      this.tank.anchor.setTo(0.5, 0.5);
      this.tank.animations.add('move', ['tank1', 'tank2', 'tank3', 'tank4', 'tank5', 'tank6'], 20, true);
      //  This will force it to decelerate and limit its speed
      game.physics.enable(this.tank, Phaser.Physics.ARCADE);
      this.tank.body.drag.set(0.2);
      this.tank.body.maxVelocity.setTo(400, 400);
      this.tank.body.collideWorldBounds = true;

      //  Finally the turret that we place on-top of the tank body
      this.turret = game.add.sprite(0, 0, 'tank', 'turret');
      this.turret.anchor.setTo(0.3, 0.5);

      //  A shadow below our tank
      this.shadow = game.add.sprite(0, 0, 'tank', 'shadow');
      this.shadow.anchor.setTo(0.5, 0.5);

      this.tank.bringToTop();
      this.turret.bringToTop();

      this.nextFire = 0;
      this.fireRate = 1000;
      this.currentSpeed = 0;
    }

    PlayerTank.prototype.update = function () {
      this.game.physics.arcade.overlap(enemyBullets, this.tank, this.bulletHitPlayer, null, this);

      //  Position all the parts and align rotations
      this.shadow.x = this.tank.x;
      this.shadow.y = this.tank.y;
      this.shadow.rotation = this.tank.rotation;

      this.turret.x = this.tank.x;
      this.turret.y = this.tank.y;

      this.turret.rotation = this.game.physics.arcade.angleToPointer(this.turret);
    }

    PlayerTank.prototype.bulletHitPlayer = function (tank, bullet) {
      bullet.kill();
    }

    PlayerTank.prototype.fire = function () {
      if (this.game.time.now > this.nextFire && bullets.countDead() > 0) {
        this.nextFire = this.game.time.now + this.fireRate;

        var bullet = bullets.getFirstExists(false);
        bullet.reset(this.turret.x, this.turret.y);
        bullet.rotation = this.game.physics.arcade.moveToPointer(bullet, 500, this.game.input.activePointer, 0);
      }
    }

    /** */
    function init (game) {
      phaser = game;

      function removeLogo() {
        game.input.onDown.remove(removeLogo, this);
        logo.kill();
      }

      function preload() {
        console.log("PHASER: preload");
        game.load.atlas('tank', 'assets/tanks/tanks.png', 'assets/tanks/tanks.json');
        game.load.atlas('enemy', 'assets/tanks/enemy-tanks.png', 'assets/tanks/tanks.json');
        game.load.image('logo', 'assets/tanks/logo.png');
        game.load.image('bullet', 'assets/tanks/bullet.png');
        game.load.image('earth', 'assets/tanks/scorched_earth.png');
        game.load.spritesheet('kaboom', 'assets/tanks/explosion.png', 64, 64, 23);
      }

      function initEmeny(game, tank){
        var enemiesTotal = 20;
        enemiesAlive = 20;

        for (var i = 0; i < enemiesTotal; i++)
        {
          var enemy = new EnemyTank(game, tank, enemyBullets)
          enemy.name = "enemy_" + i;
          enemies.push(enemy);
        }
      }

      function create() {
        console.log("PHASER: create");

        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        //  Resize our game world to be a 2000 x 2000 square
        game.world.setBounds(-1000, -1000, 2000, 2000);

        //  Our tiled scrolling background
        land = game.add.tileSprite(0, 0, 800, 600, 'earth');
        land.fixedToCamera = true;

        //  The enemies bullet group
        enemyBullets = game.add.group();
        enemyBullets.enableBody = true;
        enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
        enemyBullets.createMultiple(100, 'bullet');

        enemyBullets.setAll('anchor.x', 0.5);
        enemyBullets.setAll('anchor.y', 0.5);
        enemyBullets.setAll('outOfBoundsKill', true);
        enemyBullets.setAll('checkWorldBounds', true);

        //  player bullet group
        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(30, 'bullet', 0, false);
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 0.5);
        bullets.setAll('outOfBoundsKill', true);
        bullets.setAll('checkWorldBounds', true);

        //  Explosion pool
        explosions = game.add.group();

        for (var i = 0; i < 10; i++) {
          var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
          explosionAnimation.anchor.setTo(0.5, 0.5);
          explosionAnimation.animations.add('kaboom');
        }

        player = new PlayerTank(game);

        initEmeny(game, player.tank);

        logo = game.add.sprite(0, 200, 'logo');
        logo.fixedToCamera = true;

        game.input.onDown.add(removeLogo, this);

        game.camera.follow(player.tank);
        game.camera.deadzone = new Phaser.Rectangle(100, 100,
              game.scale.width, game.scale.height);
        game.camera.focusOnXY(0, 0);

        cursors = game.input.keyboard.createCursorKeys();
      }

      function update() {
        enemiesAlive = 0;
        for (var i = 0; i < enemies.length; i++) {
          if (enemies[i].alive) {
            enemiesAlive++;
            game.physics.arcade.collide(player.tank, enemies[i].tank);
            game.physics.arcade.overlap(bullets, enemies[i].tank, enemies[i].bulletHitEnemy, null, enemies[i]);
            enemies[i].update();
          }
        }

        if (cursors.left.isDown) {
          player.tank.angle -= 4;
        }
        else if (cursors.right.isDown) {
          player.tank.angle += 4;
        }

        if (cursors.up.isDown) {
          //  The speed we'll travel at
          player.currentSpeed = 300;
        }
        else {
          if (player.currentSpeed > 0) {
            player.currentSpeed -= 4;
          }
        }

        if (player.currentSpeed > 0) {
          game.physics.arcade.velocityFromRotation(player.tank.rotation, player.currentSpeed, player.tank.body.velocity);
        }

        land.tilePosition.x = -game.camera.x;
        land.tilePosition.y = -game.camera.y;

        player.update();

        if (game.input.activePointer.isDown) {
          //  Boom!
          player.fire();
        }
      }

      return {
        preload: preload,
        create: create,
        update: update,
        render: function () {
          game.debug.text('Enemies: ' + enemiesAlive + ' / ' + enemies.length, 32, 32);
        }
      }
    }

    return {
      init: init,
      enemies: enemies,
      addEnemy: function(doc) {
        var enemy = new EnemyTank(phaser, player.tank, enemyBullets);
        angular.extend(enemy, doc);
        enemies.push(enemy);
      }
    }
  });
