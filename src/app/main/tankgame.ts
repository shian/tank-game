/*jshint strict: false */
///<reference path="../../../bower_components/phaser/typescript/phaser.d.ts" />

module TankGame {
  'use strict';

  //-- Global Resource --
  var game:Phaser.Game;
  var SCREEN_LEFT = 0;
  var SCREEN_TOP = 0;
  var SCREEN_RIGHT = 800;
  var SCREEN_BOTTOM = 600;

  module Explosions {
    /* 爆炸的動畫 */
    var group:Phaser.Group;

    export function init():void {
      group = game.add.group();
      for (var i = 0; i < 10; i++) {
        var explosionAnimation = group.create(0, 0, 'kaboom', [0], false);
        explosionAnimation.anchor.setTo(0.5, 0.5);
        explosionAnimation.animations.add('kaboom');
      }
      game.world.bringToTop(group);
    }

    export function start(x:number, y:number):void {
      var explosionAnimation = group.getFirstExists(false);
      if(explosionAnimation) {
        explosionAnimation.reset(x, y);
        explosionAnimation.play('kaboom', 30, false, true);
      }
    }
  }

  module EnemyBullets {
    var group:Phaser.Group;

    export function init(num:number):void {
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
      game.physics.arcade.overlap(group, tank, hitCallback, null, cbParam);
    }

    export function fire(x:number, y:number, obj:any):void {
      var bullet = group.getFirstDead();
      bullet.reset(x, y);
      bullet.rotation = game.physics.arcade.moveToObject(bullet, obj, 500);
    }

    export function countDead():number {
      return group.countDead();
    }
  }

  module PlayerBullets {
    var group:Phaser.Group;

    export function init(num:number):void {
      group = game.add.group();
      group.enableBody = true;
      group.physicsBodyType = Phaser.Physics.ARCADE;
      group.createMultiple(num, 'bullet', 0, false);
      group.setAll('anchor.x', 0.5);
      group.setAll('anchor.y', 0.5);
      group.setAll('outOfBoundsKill', true);
      group.setAll('checkWorldBounds', true);
    }

    export function testHit(tank:Phaser.Sprite, hitCallback, cbParam):void {
      game.physics.arcade.overlap(group, tank, hitCallback, null, cbParam);
    }

    export function fire(x:number, y:number, toPointer:Phaser.Pointer):void {
      var bullet = group.getFirstExists(false);
      bullet.reset(x, y);
      bullet.rotation = game.physics.arcade.moveToPointer(bullet, 500, toPointer, 0);
    }

    export function countDead():number {
      return group.countDead();
    }
  }

  //-- Class
  class EnemyTank extends Phaser.Sprite {
    health = 3;
    //fireRate = 1000;
    //nextFire = 0;
    alive = true;

    player:Phaser.Sprite;
    turret:Phaser.Sprite;

    constructor(player:Phaser.Sprite, x:number, y:number) {
      super(game, x, y, 'enemy', 'tank1');
      this.player = player;
      game.physics.enable(this, Phaser.Physics.ARCADE);
      this.body.immovable = false;
      this.anchor.set(0.5);
      this.health = game.rnd.between(3, 10);

      this.turret = new Phaser.Sprite(game, 0, 0, 'enemy', 'turret');
      this.turret.anchor.set(0.3, 0.5);
      this.addChild(this.turret);
    }

    xStart () {
      game.physics.arcade.moveToXY(this, SCREEN_RIGHT+50, this.y, game.rnd.between(50, 100));
    }

    xDamage():boolean {
      this.health -= 1;
      if (this.health <= 0) {
        this.kill();

        return true;
      }
      return false;
    }

    xUpdate() : void {
      if (this.x > SCREEN_RIGHT+50){
        this.x = SCREEN_LEFT-50;
        game.physics.arcade.moveToXY(this, SCREEN_RIGHT+50, this.y, game.rnd.between(50, 100));
      }
    }

    bulletHitEnemy(tank, bullet):void {
      bullet.kill();
      this.xDamage();
      Explosions.start(this.x, this.y);
    }
  }

  class PlayerTank extends Phaser.Sprite {
    turret:Phaser.Sprite;

    nextFire = 0;
    fireRate = 100;
    currentSpeed = 0;

    constructor() {
      //  The base of our tank
      super(game, SCREEN_RIGHT/2, SCREEN_BOTTOM-50, 'tank', 'tank1');
      this.anchor.setTo(0.5, 0.5);
      this.animations.add('move', ['tank1', 'tank2', 'tank3', 'tank4', 'tank5', 'tank6'], 20, true);
      //  This will force it to decelerate and limit its speed
      game.physics.enable(this, Phaser.Physics.ARCADE);
      this.body.drag.set(0.2);
      this.body.maxVelocity.setTo(400, 400);
      this.body.collideWorldBounds = true;

      //  Finally the turret that we place on-top of the tank body
      this.turret = new Phaser.Sprite(game, 0, 0, 'tank', 'turret');
      this.turret.anchor.setTo(0.3, 0.5);
      this.turret.angle=-90;
      this.addChild(this.turret);
    }

    update():void {
      super.update();
      EnemyBullets.testHit(this, this.bulletHitPlayer, this);

      this.turret.rotation = game.physics.arcade.angleToPointer(this);
    }

    bulletHitPlayer(tank, bullet):void {
      bullet.kill();
    }

    fire():void {
      if (game.time.now > this.nextFire && PlayerBullets.countDead() > 0) {
        this.nextFire = game.time.now + this.fireRate;

        PlayerBullets.fire(this.x, this.y, game.input.activePointer);
      }
    }
  }

  /**** State ****/
  class BootState extends Phaser.State {

    create(){
      // 設定螢幕縮放
      game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      game.scale.pageAlignHorizontally = true;
      game.scale.pageAlignVertically = true;

      game.state.start('game');
    }
  }


  class GameState extends Phaser.State {
    land:Phaser.TileSprite;
    logo:Phaser.Sprite;
    cursors:any;

    enemiesAlive:number;

    player:PlayerTank;
    enemyGroup: Phaser.Group;

    removeLogo():void {
      this.game.input.onDown.remove(this.removeLogo, this);
      this.logo.kill();
    }

    initEnemy(tank):void {
      var enemiesTotal = 5;
      this.enemiesAlive = 20;

      for (var i = 0; i < enemiesTotal; i++) {
        var enemy = new EnemyTank(tank, SCREEN_LEFT-50, (i%5+1)*70);
        this.enemyGroup.add(enemy);
        enemy.xStart();
      }
    }

    preload():void {
      console.log('PHASER: preload');
      game.load.atlas('tank', 'assets/tanks/tanks.png', 'assets/tanks/tanks.json');
      game.load.atlas('enemy', 'assets/tanks/enemy-tanks.png', 'assets/tanks/tanks.json');
      game.load.image('logo', 'assets/tanks/logo.png');
      game.load.image('bullet', 'assets/tanks/bullet.png');
      game.load.image('earth', 'assets/tanks/scorched_earth.png');
      game.load.spritesheet('kaboom', 'assets/tanks/explosion.png', 64, 64, 23);
    }

    create():void {
      console.log('PHASER: create');
      // 設定邊界
      game.world.setBounds(SCREEN_LEFT, SCREEN_TOP, SCREEN_RIGHT, SCREEN_BOTTOM);
      // 設定背景
      this.land = game.add.tileSprite(SCREEN_LEFT, SCREEN_TOP, SCREEN_RIGHT, SCREEN_BOTTOM, 'earth');
      this.land.fixedToCamera = true;

      PlayerBullets.init(30);
      EnemyBullets.init(100);

      this.player = new PlayerTank();
      this.add.existing(this.player);

      this.enemyGroup = game.add.group();
      this.initEnemy(this.player);

      Explosions.init();

      this.logo = game.add.sprite(0, 200, 'logo');
      this.logo.fixedToCamera = true;

      game.input.onDown.add(this.removeLogo, this);

      //game.camera.follow(this.player);
      //game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
      //game.camera.focusOnXY(0, 0);

      this.cursors = game.input.keyboard.createCursorKeys();
    }

    update():void {
      this.enemiesAlive = 0;
      for (var i = 0; i < this.enemyGroup.length; i++) {
        var enemy = this.enemyGroup.getAt(i);
        if (enemy.alive) {
          this.enemiesAlive++;
          game.physics.arcade.collide(this.player, enemy);

          PlayerBullets.testHit(enemy, enemy.bulletHitEnemy, enemy);
          //this.enemies[i].update();
        }
        enemy.xUpdate();
      }

      this.player.update();

      if (game.input.activePointer.isDown) {
        //  Boom!
        this.player.fire();
      }
    }

    render():void {
      game.debug.text('Enemies: ' + this.enemiesAlive + ' / ' + this.enemyGroup.length, 32, 32);
    }
  }

  export class Game extends Phaser.Game {
    constructor(dom:string) {
      super(SCREEN_RIGHT, SCREEN_BOTTOM, Phaser.AUTO, dom);
      game = this;

      this.state.add('boot', new BootState());
      this.state.add('game', new GameState());

      this.state.start('boot', true, true);
    }
  }
}
