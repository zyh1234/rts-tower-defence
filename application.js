var game // for development to access game object in browser

var canvas, // global for development... to be merged into its own class
    context,
    width = 600,
    height = 600,
    buildingX = (width / 2) - 25, buildingY = height - 75, buildingW = 50, buildingH = 50;


// Game logic
$(document).ready(function() {
  game = new Game
  View.enablePauseButton()
});

// Board model

function Board() {
  this.canvas = document.getElementById("canvas"); // TKTKTK build dynamically
  this.width = 600; // TKTKTK change to constant eventually
  this.height = 600; // TKTKTK change to constant eventually
}

// Game model

function Game() {
  this.resources = {matter: GameOptions.STARTING_MATTER, energy: GameOptions.STARTING_ENERGY};
  this.buildings = [GameOptions.COMMAND_CENTER];
  this.isBuilding = false;
  this.currentBuildOrder = undefined;
  this.currentBuildTicker = 0; // increase this one per tick; check, push and reset in build function

  this.board = Game.buildGrid();

  this.setBuildListeners();
  this.startGameCycle();
}

Game.buildGrid = function() {
  return [["", "", "", "", "", "", "", "", "", ""],
         ["", "", "", "", "", "", "", "", "", ""],
         ["", "", "", "", "", "", "", "", "", ""],
         ["", "", "", "", "", "", "", "", "", ""],
         ["", "", "", "", "", "", "", "", "", ""],
         ["", "", "", "", "", "", "", "", "", ""],
         ["", "", "", "", "", "", "", "", "", ""],
         ["", "", "", "", "", "", "", "", "", ""],
         ["", "", "", "", "", "", "", "", "", ""],
         ["", "", "", "", "", "", "", "", "", ""]]
}

Game.prototype.startGameCycle = function() {
  setInterval(this.coreGameLoop.bind(this), 500);
}

Game.prototype.coreGameLoop = function() {
  this.updateResources();
  View.updateBuildProgress(this.buildProgress());
  View.updateBuildingCount(this.calculateBuildingCount());
  View.displayResources(this.resources);
  View.displayResourceFlow(this.calculateResourcesPerCycle());
}

Game.prototype.updateResources = function() {
  var resourcesToAdd = this.calculateResourcesPerCycle(); // return {matter: x, energy: y}
  this.resources.matter += resourcesToAdd.matter;
  if (this.resources.matter < 0) {this.resources.matter = 0}
  this.resources.energy += resourcesToAdd.energy;
  if (this.resources.energy < 0) {this.resources.energy = 0}
}

Game.prototype.calculateResourcesPerCycle = function() {
  var matterThisCycle = 0;
  var energyThisCycle = 0;
  for (var i = 0; i < this.buildings.length; i++) {
    matterThisCycle += this.buildings[i].matterProduction;
    energyThisCycle += this.buildings[i].energyProduction;
  }
  return {matter: matterThisCycle, energy: energyThisCycle}
}

Game.prototype.calculateBuildingCount = function() {
  var buildings = {}
  for (var i = 0; i < this.buildings.length; i++) {
    if( buildings[this.buildings[i].name]) {
      buildings[this.buildings[i].name] += 1;
    } else {
      buildings[this.buildings[i].name] = 1;
    }
  }
  return buildings;
}

Game.prototype.setBuildListeners = function() {
  $("#new-solar").on("click", null, "Solar Power Plant", this.build.bind(this));
  $("#new-mine").on("click", null, "Matter Mine", this.build.bind(this));
}

Game.prototype.buildProgress = function() {
  var percentBuilt = 0;
  if (this.currentBuildOrder) {
    this.currentBuildTicker++;
    percentBuilt = (this.currentBuildTicker / this.currentBuildOrder.buildTime) * 100;
    if (this.currentBuildTicker === this.currentBuildOrder.buildTime) {
      this.buildings.push(this.currentBuildOrder);
      this.currentBuildOrder = undefined;
      this.currentBuildTicker = 0;
    }
  }
  return percentBuilt; // return an integer between 0 and 100
}

Game.prototype.build = function(event) {
  var building = new Building(BuildingsList[event.data]);
  if (this.currentBuildOrder) {
    View.displayStatusMessage("Already building " + this.currentBuildOrder.name + ".")
    console.log("Already building " + this.currentBuildOrder.name + ".");
  } else if (building.energyCost >= this.resources.energy) {
    View.displayStatusMessage("Insuffcient energy to build " + building.name);
    console.log("Insuffcient energy to build " + building.name);
  } else if (building.matterCost >= this.resources.matter) {
    View.displayStatusMessage("Insuffcient matter to build " + building.name);
    console.log("Insuffcient matter to build " + building.name);
  } else {
    this.currentBuildOrder = building;
    this.resources.matter -= building.matterCost;
    this.resources.energy -= building.energyCost;
  }
}

// Buildings List

var BuildingsList = {
  "Command Center":    {name: "Command Center",
                        hp: 3000,
                        matterCost: 5000,
                        energyCost: 50000,
                        matterProduction: 2,
                        energyProduction: 25,
                        buildTime: 1000},

  "Matter Mine":       {name: "Matter Mine",
                        hp: 200,
                        matterCost: 50,
                        energyCost: 520,
                        matterProduction: 2,
                        energyProduction: -5,
                        buildTime: 18},

  "Solar Power Plant": {name: "Solar Power Plant",
                        hp: 100,
                        matterCost: 150,
                        energyCost: 800,
                        matterProduction: 0,
                        energyProduction: 20,
                        buildTime: 24},

  "Laser Tower":       {name: "Laser Tower",
                        hp: 500,
                        matterCost: 150,
                        energyCost: 800,
                        matterProduction: 0,
                        energyProduction: 0,
                        energyPerShot: 200,
                        damagePerShot: 50,
                        fireTime: 1,
                        buildTime: 40},

  "Build Slot":        {name: "Build Slot",
                        hp: 100,
                        matterCost: 1000,
                        energyCost: 5000,
                        matterProduction: -5,
                        energyProduction: -10,
                        buildTime: 50}
}

// Game constants

var GameOptions = {
  STARTING_MATTER: 1000,
  STARTING_ENERGY: 5000,
  COMMAND_CENTER: new Building(BuildingsList["Command Center"])
}

// Building model

function Building(options) {
  this.name = options.name;
  this.matterCost = options.matterCost;
  this.energyCost = options.energyCost;
  this.matterProduction = options.matterProduction;
  this.energyProduction = options.energyProduction;
  this.buildTime = options.buildTime;
}

// View

var View = (function() {
View = {};
View.displayResources = function(resources) {
  $("#matter-display").text("Matter: " + resources.matter);
  $("#energy-display").text("Energy: " + resources.energy);
}

View.displayResourceFlow = function(flow) {
  $("#net-matter-flow").text("Flow: " + flow.matter);
  $("#net-energy-flow").text("Flow: " + flow.energy);
}

// TODO: refactor to allow any number of building names / counts
View.updateBuildingCount = function(buildings) {
  $("#solar-plant-count").html("Solar Power Plants: " + (buildings["Solar Power Plant"] || "0"));
  $("#matter-mine-count").html("Matter Mines: " + (buildings["Matter Mine"] || "0"));
}

View.updateBuildProgress = function(progress) {
  $("progress").attr("value", progress);
}

View.displayStatusMessage = function(message) {
  $("#status-message").text(message);
}

View.enablePauseButton = function() {
  $("#pause").on("click", function() {alert("Game Paused.")})
}
  return View;
})();
