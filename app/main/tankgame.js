/*jshint strict: false */
///<reference path="../../../bower_components/phaser/typescript/phaser.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TankGame;
(function (TankGame) {
    //-- Global Resource --
    var game;
    var Explosions;
    (function (Explosions) {
        /* 爆炸的動畫 */
        var group;
        function init() {
            group = game.add.group();
            for (var i = 0; i < 10; i++) {
                var explosionAnimation = group.create(0, 0, 'kaboom', [0], false);
                explosionAnimation.anchor.setTo(0.5, 0.5);
                explosionAnimation.animations.add('kaboom');
            }
        }
        Explosions.init = init;
        function start(x, y) {
            var explosionAnimation = group.getFirstExists(false);
            explosionAnimation.reset(x, y);
            explosionAnimation.play('kaboom', 30, false, true);
        }
        Explosions.start = start;
    })(Explosions || (Explosions = {}));
    var EnemyBullets;
    (function (EnemyBullets) {
        var group;
        function init(num) {
            group = game.add.group();
            group.enableBody = true;
            group.physicsBodyType = Phaser.Physics.ARCADE;
            group.createMultiple(num, 'bullet', 0, false);
            group.setAll('anchor.x', 0.5);
            group.setAll('anchor.y', 0.5);
            group.setAll('outOfBoundsKill', true);
            group.setAll('checkWorldBounds', true);
        }
        EnemyBullets.init = init;
        function testHit(tank, hitCallback, cbParam) {
            game.physics.arcade.overlap(group, tank, hitCallback, null, cbParam);
        }
        EnemyBullets.testHit = testHit;
        function fire(x, y, obj) {
            var bullet = group.getFirstDead();
            bullet.reset(x, y);
            bullet.rotation = game.physics.arcade.moveToObject(bullet, obj, 500);
        }
        EnemyBullets.fire = fire;
        function countDead() {
            return group.countDead();
        }
        EnemyBullets.countDead = countDead;
    })(EnemyBullets || (EnemyBullets = {}));
    var PlayerBullets;
    (function (PlayerBullets) {
        var group;
        function init(num) {
            group = game.add.group();
            group.enableBody = true;
            group.physicsBodyType = Phaser.Physics.ARCADE;
            group.createMultiple(num, 'bullet', 0, false);
            group.setAll('anchor.x', 0.5);
            group.setAll('anchor.y', 0.5);
            group.setAll('outOfBoundsKill', true);
            group.setAll('checkWorldBounds', true);
        }
        PlayerBullets.init = init;
        function testHit(tank, hitCallback, cbParam) {
            game.physics.arcade.overlap(group, tank, hitCallback, null, cbParam);
        }
        PlayerBullets.testHit = testHit;
        function fire(x, y, toPointer) {
            var bullet = group.getFirstExists(false);
            bullet.reset(x, y);
            bullet.rotation = game.physics.arcade.moveToPointer(bullet, 500, toPointer, 0);
        }
        PlayerBullets.fire = fire;
        function countDead() {
            return group.countDead();
        }
        PlayerBullets.countDead = countDead;
    })(PlayerBullets || (PlayerBullets = {}));
    //-- Class
    var EnemyTank = (function () {
        function EnemyTank(player) {
            this.health = 3;
            this.fireRate = 1000;
            this.nextFire = 0;
            this.alive = true;
            this.player = player;
            this.x = game.world.randomX;
            this.y = game.world.randomY;
            this.shadow = game.add.sprite(this.x, this.y, 'enemy', 'shadow');
            this.tank = game.add.sprite(this.x, this.y, 'enemy', 'tank1');
            this.turret = game.add.sprite(this.x, this.y, 'enemy', 'turret');
            this.shadow.anchor.set(0.5);
            this.tank.anchor.set(0.5);
            this.turret.anchor.set(0.3, 0.5);
            game.physics.enable(this.tank, Phaser.Physics.ARCADE);
            this.tank.body.immovable = false;
            this.tank.body.collideWorldBounds = true;
            this.tank.body.bounce.setTo(1, 1);
            this.tank.angle = game.rnd.angle();
            game.physics.arcade.velocityFromRotation(this.tank.rotation, 100, this.tank.body.velocity);
        }
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
            this.turret.rotation = game.physics.arcade.angleBetween(this.tank, this.player);
            if (game.physics.arcade.distanceBetween(this.tank, this.player) < 300) {
                if (game.time.now > this.nextFire && EnemyBullets.countDead() > 0) {
                    this.nextFire = game.time.now + this.fireRate;
                    EnemyBullets.fire(this.turret.x, this.turret.y, this.player);
                }
            }
        };
        EnemyTank.prototype.bulletHitEnemy = function (tank, bullet) {
            bullet.kill();
            var destroyed = this.damage();
            if (destroyed) {
                Explosions.start(this.tank.x, this.tank.y);
            }
        };
        return EnemyTank;
    })();
    var PlayerTank = (function () {
        function PlayerTank() {
            this.nextFire = 0;
            this.fireRate = 1000;
            this.currentSpeed = 0;
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
        }
        PlayerTank.prototype.update = function () {
            EnemyBullets.testHit(this.tank, this.bulletHitPlayer, this);
            //  Position all the parts and align rotations
            this.shadow.x = this.tank.x;
            this.shadow.y = this.tank.y;
            this.shadow.rotation = this.tank.rotation;
            this.turret.x = this.tank.x;
            this.turret.y = this.tank.y;
            this.turret.rotation = game.physics.arcade.angleToPointer(this.turret);
        };
        PlayerTank.prototype.bulletHitPlayer = function (tank, bullet) {
            bullet.kill();
        };
        PlayerTank.prototype.fire = function () {
            if (game.time.now > this.nextFire && PlayerBullets.countDead() > 0) {
                this.nextFire = game.time.now + this.fireRate;
                PlayerBullets.fire(this.turret.x, this.turret.y, game.input.activePointer);
            }
        };
        return PlayerTank;
    })();
    var GameState = (function (_super) {
        __extends(GameState, _super);
        function GameState() {
            _super.apply(this, arguments);
            this.enemies = [];
        }
        GameState.prototype.removeLogo = function () {
            this.game.input.onDown.remove(this.removeLogo, this);
            this.logo.kill();
        };
        GameState.prototype.initEnemy = function (tank) {
            var enemiesTotal = 20;
            this.enemiesAlive = 20;
            for (var i = 0; i < enemiesTotal; i++) {
                var enemy = new EnemyTank(tank);
                this.enemies.push(enemy);
            }
        };
        GameState.prototype.preload = function () {
            console.log('PHASER: preload');
            game.load.atlas('tank', 'assets/tanks/tanks.png', 'assets/tanks/tanks.json');
            game.load.atlas('enemy', 'assets/tanks/enemy-tanks.png', 'assets/tanks/tanks.json');
            game.load.image('logo', 'assets/tanks/logo.png');
            game.load.image('bullet', 'assets/tanks/bullet.png');
            game.load.image('earth', 'assets/tanks/scorched_earth.png');
            game.load.spritesheet('kaboom', 'assets/tanks/explosion.png', 64, 64, 23);
        };
        GameState.prototype.create = function () {
            console.log('PHASER: create');
            game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            game.scale.pageAlignHorizontally = true;
            game.scale.pageAlignVertically = true;
            //  Resize our game world to be a 2000 x 2000 square
            game.world.setBounds(-1000, -1000, 2000, 2000);
            //  Our tiled scrolling background
            this.land = game.add.tileSprite(0, 0, 800, 600, 'earth');
            this.land.fixedToCamera = true;
            PlayerBullets.init(30);
            EnemyBullets.init(100);
            Explosions.init();
            this.player = new PlayerTank();
            this.initEnemy(this.player.tank);
            this.logo = game.add.sprite(0, 200, 'logo');
            this.logo.fixedToCamera = true;
            game.input.onDown.add(this.removeLogo, this);
            game.camera.follow(this.player.tank);
            game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
            game.camera.focusOnXY(0, 0);
            this.cursors = game.input.keyboard.createCursorKeys();
        };
        GameState.prototype.update = function () {
            this.enemiesAlive = 0;
            for (var i = 0; i < this.enemies.length; i++) {
                if (this.enemies[i].alive) {
                    this.enemiesAlive++;
                    game.physics.arcade.collide(this.player.tank, this.enemies[i].tank);
                    PlayerBullets.testHit(this.enemies[i].tank, this.enemies[i].bulletHitEnemy, this.enemies[i]);
                    this.enemies[i].update();
                }
            }
            if (this.cursors.left.isDown) {
                this.player.tank.angle -= 4;
            }
            else if (this.cursors.right.isDown) {
                this.player.tank.angle += 4;
            }
            if (this.cursors.up.isDown) {
                //  The speed we'll travel at
                this.player.currentSpeed = 300;
            }
            else {
                if (this.player.currentSpeed > 0) {
                    this.player.currentSpeed -= 4;
                }
            }
            if (this.player.currentSpeed > 0) {
                this.game.physics.arcade.velocityFromRotation(this.player.tank.rotation, this.player.currentSpeed, this.player.tank.body.velocity);
            }
            this.land.tilePosition.x = -this.game.camera.x;
            this.land.tilePosition.y = -this.game.camera.y;
            this.player.update();
            if (game.input.activePointer.isDown) {
                //  Boom!
                this.player.fire();
            }
        };
        GameState.prototype.render = function () {
            game.debug.text('Enemies: ' + this.enemiesAlive + ' / ' + this.enemies.length, 32, 32);
        };
        return GameState;
    })(Phaser.State);
    var Game = (function (_super) {
        __extends(Game, _super);
        function Game(dom) {
            _super.call(this, 800, 600, Phaser.AUTO, dom);
            game = this;
            this.state.add('main', new GameState());
        }
        return Game;
    })(Phaser.Game);
    TankGame.Game = Game;
})(TankGame || (TankGame = {}));
//# sourceMappingURL=tankgame.js.map