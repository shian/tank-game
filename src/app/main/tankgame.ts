/*jshint strict: false */
///<reference path="../../../bower_components/phaser/typescript/phaser.d.ts" />

module TankGame {
  'use strict';

  //-- Global Resource --
  var SCREEN_LEFT = 0;
  var SCREEN_TOP = 0;
  var SCREEN_RIGHT = 800;
  var SCREEN_BOTTOM = 600;

  class Bullet extends Phaser.Sprite {
    constructor(game: Phaser.Game) {
      super(game, 0, 0, 'bullet');
      this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
      this.anchor.set(0.5);
      this.checkWorldBounds = true;
      this.outOfBoundsKill = true;
      this.alive = false;
      this.exists = false;
    }
  }

  class Explosions extends Phaser.Group {
    /* 爆炸的動畫 */
    constructor(game:Phaser.Game) {
      super(game);
      for (var i = 0; i < 100; i++) {
        var explosionAnimation = this.create(0, 0, 'kaboom', [0], false);
        explosionAnimation.anchor.setTo(0.5, 0.5);
        explosionAnimation.animations.add('kaboom');
      }
    }

    play (x:number, y:number) : void {
      var explosionAnimation = this.getFirstExists(false);
      if(explosionAnimation) {
        explosionAnimation.reset(x, y);
        explosionAnimation.play('kaboom', 30, false, true);
      }
    }
  }

  class BulletPool extends Phaser.Group {
    constructor(game:Phaser.Game, num:number) {
      super(game);
      this.enableBody = true;
      this.physicsBodyType = Phaser.Physics.ARCADE;

      for(var i=0; i<num; i++){
        var bullet = new Bullet(game);
        this.add(bullet);
      }
    }

    fireToObject(x:number, y:number, obj:Phaser.Sprite) : void {
      var bullet = this.getFirstDead();
      bullet.reset(x, y);
      bullet.rotation = this.game.physics.arcade.moveToObject(bullet, obj, 500);
    }

    fireToPointer(x:number, y:number, toPointer:Phaser.Pointer) : void {
      var bullet = this.getFirstExists(false);
      bullet.reset(x, y);
      bullet.rotation = this.game.physics.arcade.moveToPointer(bullet, 500, toPointer, 0);
    }
  }

  //-- Class
  class EnemyTank extends Phaser.Sprite {
    //fireRate = 1000;
    //nextFire = 0;
    alive = true;
    turret:Phaser.Sprite;

    constructor(game:Phaser.Game, x:number, y:number) {
      super(game, x, y, 'enemy', 'tank1');

      game.physics.enable(this, Phaser.Physics.ARCADE);
      this.body.immovable = false;
      this.anchor.set(0.5);
      this.checkWorldBounds = true;
      this.outOfBoundsKill = true;

      this.turret = new Phaser.Sprite(game, 0, 0, 'enemy', 'turret');
      this.turret.anchor.set(0.3, 0.5);
      this.addChild(this.turret);
    }

    go(x1:number, y1:number, x2:number, y2:number) {
      this.reset(x1, y1, this.game.rnd.between(3, 10))
      this.game.physics.arcade.moveToXY(this, x2, y2, this.game.rnd.between(50, 100));
    }

    xDamage(amount:number) {
      this.health -= amount;
      if(this.health <= 0){
        this.kill();
      }
    }
  }

  class PlayerTank extends Phaser.Sprite {
    turret:Phaser.Sprite;

    nextFire = 0;
    fireRate = 100;
    currentSpeed = 0;

    constructor(game) {
      super(game, SCREEN_RIGHT/2, SCREEN_BOTTOM-50, 'tank', 'tank1');
      //  The base of our tank
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
      // 追蹤游標及發射火砲
      this.turret.rotation = this.game.physics.arcade.angleToPointer(this);
    }

    fire(bullets: BulletPool):void {
      if (this.game.time.now > this.nextFire && bullets.countDead() > 0) {
        this.nextFire = this.game.time.now + this.fireRate;
        bullets.fireToPointer(this.x, this.y, this.game.input.activePointer);
      }
    }
  }

  /**** State ****/
  class BootState extends Phaser.State {
    // 初始化
    create(){

      // 設定螢幕縮放
      this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      this.game.scale.pageAlignHorizontally = true;
      this.game.scale.pageAlignVertically = true;
      // 設定輸入
      this.input.maxPointers= 1;

      this.game.state.start('game');
    }
  }

  class GameState extends Phaser.State {
    land:Phaser.TileSprite;
    logo:Phaser.Sprite;
    cursors:any;
    generateRate = 1000;
    nextGenerateTime = 0;

    enemiesKills:number = 0;

    player:PlayerTank;
    playerBullets: BulletPool;
    enemyGroup: Phaser.Group;
    enemyBullets: BulletPool;
    explosions: Explosions;

    //-- Preload ------------------------------------------------------------------
    preload():void {
      console.log('PHASER: preload');
      this.game.load.atlas('tank', 'assets/tanks/tanks.png', 'assets/tanks/tanks.json');
      this.game.load.atlas('enemy', 'assets/tanks/enemy-tanks.png', 'assets/tanks/tanks.json');
      this.game.load.image('logo', 'assets/tanks/logo.png');
      this.game.load.image('bullet', 'assets/tanks/bullet.png');
      this.game.load.image('earth', 'assets/tanks/scorched_earth.png');
      this.game.load.spritesheet('kaboom', 'assets/tanks/explosion.png', 64, 64, 23);
    }

    //-- Create --------------------------------------------------------------------
    removeLogo():void {
      this.game.input.onDown.remove(this.removeLogo, this);
      this.logo.kill();
    }

    initEnemy():void {
      this.enemyGroup = this.game.add.group();
      for (var i = 0; i < 20; i++) {
        var enemy = new EnemyTank(this.game, SCREEN_LEFT-50, (i%5+1)*70);
        this.enemyGroup.add(enemy);
      }
    }

    create():void {
      console.log('PHASER: create', SCREEN_LEFT, SCREEN_TOP, SCREEN_RIGHT, SCREEN_BOTTOM);
      // 設定邊界
      this.game.world.setBounds(SCREEN_LEFT, SCREEN_TOP, SCREEN_RIGHT, SCREEN_BOTTOM);
      // 設定背景
      this.land = this.game.add.tileSprite(SCREEN_LEFT, SCREEN_TOP, SCREEN_RIGHT, SCREEN_BOTTOM, 'earth');
      this.land.fixedToCamera = true;
      // 加入世界的順序會影響畫面上的層次
      this.playerBullets = new BulletPool(this.game, 30);
      this.add.existing(this.playerBullets);
      this.enemyBullets = new BulletPool(this.game, 100);
      this.add.existing(this.enemyBullets);

      this.player = new PlayerTank(this.game);
      this.add.existing(this.player);

      this.initEnemy();

      this.explosions = new Explosions(this.game);
      this.add.existing(this.explosions);

      this.logo = this.game.add.sprite(0, 200, 'logo');
      this.logo.fixedToCamera = true;

      this.game.input.onDown.add(this.removeLogo, this);

      //game.camera.follow(this.player);
      //game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
      //game.camera.focusOnXY(0, 0);

      this.cursors = this.game.input.keyboard.createCursorKeys();
    }

    //-- Update ------------------------------------------------------------------------
    hitCallback(tank, bullet) : void {
      bullet.kill();
      this.explosions.play(tank.x, tank.y);
      tank.xDamage(1);
      if (tank.alive == false) {
        this.enemiesKills += 1;
      }
    }

    generateEnemy () {
      var tank = this.enemyGroup.getFirstDead();
      var y = this.game.rnd.between(SCREEN_TOP+50, (SCREEN_TOP+SCREEN_BOTTOM)/2);
      tank.go(0, y, SCREEN_RIGHT+50, y);
    }

    update():void {
      // 檢查火砲是否擊中敵人
      this.game.physics.arcade.overlap(this.enemyGroup, this.playerBullets, this.hitCallback, null, this);
      // 檢查火砲是否集中玩家
      this.game.physics.arcade.overlap(this.player, this.enemyBullets, this.hitCallback, null, this);
      // 是否發射火砲
      if (this.game.input.activePointer.isDown) {
        //  Boom!
        this.player.fire(this.playerBullets);
      }
      // 產生新的敵人
      if (this.game.time.now > this.nextGenerateTime && this.enemyGroup.countDead() > 0) {
        this.generateEnemy();
        this.nextGenerateTime = this.game.time.now + this.generateRate;
      }
    }

    render():void {
      this.game.debug.text('Kills: ' + this.enemiesKills, 32, 32);
    }
  }

  export class Game extends Phaser.Game {
    constructor(dom:string) {
      super(SCREEN_RIGHT, SCREEN_BOTTOM, Phaser.AUTO, dom);

      this.state.add('boot', new BootState());
      this.state.add('game', new GameState());

      this.state.start('boot', true, true);
    }
  }
}
