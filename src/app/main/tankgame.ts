
///<reference path="../../../bower_components/phaser/typescript/phaser.d.ts" />

module TankGame {

  //-- Global Resource --
  module Explosions {
    /* 爆炸的動畫 */
    var group: Phaser.Group;

    export function init(game: Phaser.Game) :void {
      group = game.add.group();
      for (var i = 0; i < 10; i++) {
        var explosionAnimation = group.create(0, 0, 'kaboom', [0], false);
        explosionAnimation.anchor.setTo(0.5, 0.5);
        explosionAnimation.animations.add('kaboom');
      }
    }

    export function start(x:number, y:number) : void {
      var explosionAnimation = group.getFirstExists(false);
      explosionAnimation.reset(x, y);
      explosionAnimation.play('kaboom', 30, false, true);
    }
  }

  module EnemyBullets {
    var _game: Phaser.Game;
    var group: Phaser.Group;

    export function init(game:Phaser.Game, num:number):void {
      _game=game;
      group = game.add.group();
      group.enableBody = true;
      group.physicsBodyType = Phaser.Physics.ARCADE;
      group.createMultiple(num, 'bullet', 0, false);
      group.setAll('anchor.x', 0.5);
      group.setAll('anchor.y', 0.5);
      group.setAll('outOfBoundsKill', true);
      group.setAll('checkWorldBounds', true);
    }

    export function testHit(tank:Phaser.Sprite, hitCallback, cbParam) {
      _game.physics.arcade.overlap(group, tank, hitCallback, null, cbParam);
    }

    export function fire(x:number, y:number, obj:any) : void {
      var bullet = group.getFirstDead();
      bullet.reset(x, y);
      bullet.rotation = _game.physics.arcade.moveToObject(bullet, obj, 500);
    }

    export function countDead() : number {
      return group.countDead();
    }
  }

  module PlayerBullets {
    var _game: Phaser.Game;
    var group: Phaser.Group;

    export function init(game:Phaser.Game, num:number):void {
      _game=game;
      group = game.add.group();
      group.enableBody = true;
      group.physicsBodyType = Phaser.Physics.ARCADE;
      group.createMultiple(num, 'bullet', 0, false);
      group.setAll('anchor.x', 0.5);
      group.setAll('anchor.y', 0.5);
      group.setAll('outOfBoundsKill', true);
      group.setAll('checkWorldBounds', true);
    }

    export function testHit(tank:Phaser.Sprite, hitCallback, cbParam) : void {
      _game.physics.arcade.overlap(group, tank, hitCallback, null, cbParam);
    }

    export function fire(x:number, y:number, toPointer:Phaser.Pointer) : void {
      var bullet = group.getFirstExists(false);
      bullet.reset(x, y);
      bullet.rotation = _game.physics.arcade.moveToPointer(bullet, 500, toPointer, 0);
    }

    export function countDead() : number {
      return group.countDead();
    }
  }

  //-- Class
  class EnemyTank {
    x:number;
    y:number;
    health = 3;
    fireRate = 1000;
    nextFire = 0;
    alive = true;

    game:Phaser.Game;
    player:Phaser.Sprite;

    shadow:Phaser.Sprite;
    tank:Phaser.Sprite;
    turret:Phaser.Sprite;

    constructor(game:Phaser.Game, player:Phaser.Sprite) {
      this.game = game;
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

    damage():boolean {
      this.health -= 1;
      if (this.health <= 0) {
        this.alive = false;
        this.shadow.kill();
        this.tank.kill();
        this.turret.kill();

        return true;
      }
      return false;
    }

    update():void {
      this.x = this.tank.x;
      this.y = this.tank.y;
      this.shadow.x = this.tank.x;
      this.shadow.y = this.tank.y;
      this.shadow.rotation = this.tank.rotation;

      this.turret.x = this.tank.x;
      this.turret.y = this.tank.y;
      this.turret.rotation = this.game.physics.arcade.angleBetween(this.tank, this.player);

      if (this.game.physics.arcade.distanceBetween(this.tank, this.player) < 300) {
        if (this.game.time.now > this.nextFire && EnemyBullets.countDead() > 0) {
          this.nextFire = this.game.time.now + this.fireRate;
          EnemyBullets.fire(this.turret.x, this.turret.y, this.player);
        }
      }
    }

    bulletHitEnemy(tank, bullet):void {
      bullet.kill();
      var destroyed = this.damage();

      if (destroyed) {
        Explosions.start(this.tank.x, this.tank.y);
      }
    }
  }

  class PlayerTank {
    game:Phaser.Game;
    shadow:Phaser.Sprite;
    tank:Phaser.Sprite;
    turret:Phaser.Sprite;

    nextFire = 0;
    fireRate = 1000;
    currentSpeed = 0;

    constructor(game) {
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
    }

    update():void {
      EnemyBullets.testHit(this.tank, this.bulletHitPlayer, this);

      //  Position all the parts and align rotations
      this.shadow.x = this.tank.x;
      this.shadow.y = this.tank.y;
      this.shadow.rotation = this.tank.rotation;

      this.turret.x = this.tank.x;
      this.turret.y = this.tank.y;

      this.turret.rotation = this.game.physics.arcade.angleToPointer(this.turret);
    }

    bulletHitPlayer(tank, bullet):void {
      bullet.kill();
    }

    fire():void {
      if (this.game.time.now > this.nextFire && PlayerBullets.countDead() > 0) {
        this.nextFire = this.game.time.now + this.fireRate;

        PlayerBullets.fire(this.turret.x, this.turret.y, this.game.input.activePointer);
      }
    }
  }

  export class GameState extends Phaser.State {
    game:Phaser.Game;
    land: Phaser.TileSprite;
    logo:Phaser.Sprite;
    cursors:any;

    enemiesAlive:number;

    player:PlayerTank;
    enemies:EnemyTank[]=[];

    constructor(game) {
      super();
      this.game = game;
    }

    removeLogo():void {
      this.game.input.onDown.remove(this.removeLogo, this);
      this.logo.kill();
    }

    initEnemy(game, tank):void {
      var enemiesTotal = 20;
      this.enemiesAlive = 20;

      for (var i = 0; i < enemiesTotal; i++) {
        var enemy = new EnemyTank(game, tank);
        this.enemies.push(enemy);
      }
    }

    preload():void {
      console.log("PHASER: preload");
      this.game.load.atlas('tank', 'assets/tanks/tanks.png', 'assets/tanks/tanks.json');
      this.game.load.atlas('enemy', 'assets/tanks/enemy-tanks.png', 'assets/tanks/tanks.json');
      this.game.load.image('logo', 'assets/tanks/logo.png');
      this.game.load.image('bullet', 'assets/tanks/bullet.png');
      this.game.load.image('earth', 'assets/tanks/scorched_earth.png');
      this.game.load.spritesheet('kaboom', 'assets/tanks/explosion.png', 64, 64, 23);
    }

    create():void {
      console.log("PHASER: create");

      this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      this.game.scale.pageAlignHorizontally = true;
      this.game.scale.pageAlignVertically = true;

      //  Resize our game world to be a 2000 x 2000 square
      this.game.world.setBounds(-1000, -1000, 2000, 2000);

      //  Our tiled scrolling background
      this.land = this.game.add.tileSprite(0, 0, 800, 600, 'earth');
      this.land.fixedToCamera = true;

      PlayerBullets.init(this.game, 30);
      EnemyBullets.init(this.game, 100);
      Explosions.init(this.game);

      this.player = new PlayerTank(this.game);

      this.initEnemy(this.game, this.player.tank);

      this.logo = this.game.add.sprite(0, 200, 'logo');
      this.logo.fixedToCamera = true;

      this.game.input.onDown.add(this.removeLogo, this);

      this.game.camera.follow(this.player.tank);
      this.game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
      this.game.camera.focusOnXY(0, 0);

      this.cursors = this.game.input.keyboard.createCursorKeys();
    }

    update():void {
      this.enemiesAlive = 0;
      for (var i = 0; i < this.enemies.length; i++) {
        if (this.enemies[i].alive) {
          this.enemiesAlive++;
          this.game.physics.arcade.collide(this.player.tank, this.enemies[i].tank);

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
        this.game.physics.arcade.velocityFromRotation(this.player.tank.rotation,
          this.player.currentSpeed, this.player.tank.body.velocity);
      }

      this.land.tilePosition.x = -this.game.camera.x;
      this.land.tilePosition.y = -this.game.camera.y;

      this.player.update();

      if (this.game.input.activePointer.isDown) {
        //  Boom!
        this.player.fire();
      }
    }

    render() : void {
      this.game.debug.text('Enemies: ' + this.enemiesAlive + ' / ' + this.enemies.length, 32, 32);
    }
  }
}