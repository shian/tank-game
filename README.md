
This is a practice project for Phaser. 
Base on Phaser's example [tanks](http://phaser.io/examples/v2/games/tanks).

# Development

## Tools

* [YeoMan](http://yeoman.io/)
* [TypeScript Definition manager](http://definitelytyped.org/tsd/)

```
npm install tsd -g
```

* Gulp
* Bower
* [Cordova](https://cordova.apache.org/)

## Setup

```
git clone https://github.com/shian/tank-game.git
cd tank-game
npm install -l
bower install
tsd install
```

## Dev Server

run `gulp serve`

## Build

### Web

run `gulp build`

### Mobile

``` bash
cd cordova
cordova compile
```

## Deploy

run `./deploy.sh`

# Stack

* HTML5
* CSS/LESS
* Javascript
* [Typescript](http://www.typescriptlang.org/)
* [Angular](https://angularjs.org/)
* [Angular Material](https://material.angularjs.org)
* [Phaser](http://phaser.io/)

# Reference

* https://github.com/X1011/git-directory-deploy
