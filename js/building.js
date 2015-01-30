// Building model

function Building(options, game) {
  this.game = game

  this.name = options.name;
  this.maxHp = options.hp;
  this.hp = this.maxHp;
  this.range = options.range || 100;
  this.damagePerShot = options.damagePerShot; // TKTKTK: remove energy per shot fired; no default because not all buildings can inflict damage
  this.energyPerShot = options.energyPerShot;

  this.matterCost = options.matterCost;
  this.energyCost = options.energyCost;
  this.matterProduction = options.matterProduction;
  this.energyProduction = options.energyProduction;
  this.buildTime = options.buildTime;
  this.size = options.size;
  this.color = options.color;
  this.active = options.active || false; // won't produce resources or benefits until true
  this.boardSizeX = undefined;
  this.boardSizeY = undefined;
  this.topLeftX = undefined;
  this.topLeftY = undefined;
}

Building.prototype.receiveDamage = function(damage) {
  this.hp -= damage;
}

Building.prototype.isDestroyed = function() {
  return this.hp <= 0;
}

Building.prototype.centerX = function() { // create a vector class and put this on its prototype
  return this.topLeftX + this.boardSizeX / 2 // currently duplicated on enemy and building classes
}

Building.prototype.centerY = function() { // create a vector class and put this on its prototype
  return this.topLeftY + this.boardSizeY / 2 // currently duplicated on enemy and building classes
}

Building.prototype.enemiesWithinRange = function(enemies) {
  var enemiesWithDistances = enemies.map(function(enemy){
    return {enemy: enemy, distance: enemy.distanceFrom(this)}
  }, this)
  var enemiesInRange = enemiesWithDistances.filter(function(enemy) {
    return enemy.distance <= this.range
  }, this)
  return enemiesInRange;
}

Building.prototype.closestEnemy = function(enemiesWithDistances) { // expecting an array of objects/tuples holding an enemy object and its distance from this building
  var min = {distance: Number.POSITIVE_INFINITY};
  for (var i = 0; i < enemiesWithDistances.length; i++) {
    if (enemiesWithDistances[i].distance < min.distance) { min = enemiesWithDistances[i] }
  }
  return min.enemy
}

Building.prototype.fireAt = function(enemies) {
  if (this.game.hasEnergyInSurplusOf(this.energyPerShot)) {
    var enemiesInRange = this.enemiesWithinRange(enemies);
    if (enemiesInRange[0]) {
      var closestEnemy = this.closestEnemy(enemiesInRange);
      var damage = this.damagePerShot // Math.floor(Math.random() * this.damagePerShot);
      this.game.deductEnergy(this.energyPerShot);
      this.game.board.drawLaser(this.centerX(), this.centerY(), closestEnemy.centerX(), closestEnemy.centerY());
      closestEnemy.receiveDamage(damage);
    }
  }
}

