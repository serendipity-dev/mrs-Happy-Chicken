function GameManager(size, InputManager, Actuator, StorageManager) {
  this.size           = size; // Size of the grid
  this.inputManager   = new InputManager;
  this.storageManager = new StorageManager;
  this.actuatorClass = Actuator;
  this.actuator = new this.actuatorClass();

  this.startTiles     = 1;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.inputManager.on("gotIt", this.gotIt.bind(this));
  this.inputManager.on("publishShow", this.showPublishScore.bind(this));
  this.inputManager.on("publishDo", this.doPublishScore.bind(this));
  this.setup();
}

// Do Publish score
GameManager.prototype.doPublishScore = function () {
    var outcome = document.getElementById('outcome');
    var errorPublishing = document.querySelector('.errorPublishing');
    var errorDesc = document.getElementById('errorDesc');

    errorPublishing.setAttribute("class", "errorPublishing undisplay");
    outcome.setAttribute("class", "undisplay");
    var connectivity = Windows.Networking.Connectivity;
    var profile = connectivity.NetworkInformation.getInternetConnectionProfile();

    if (profile) {
        if (profile.getNetworkConnectivityLevel() == connectivity.NetworkConnectivityLevel.internetAccess) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            var name = document.getElementById("name").value;
            var email = document.getElementById("email").value;
            if (name.trim().length > 0) {
                if (re.test(email)) {

                    var boxNameEmail = document.querySelector('.name-email');
                    var boxPublishCancel = document.querySelector('.publish-cancel');
                    var boxPublishDone = document.querySelector('.publish-done');
                    var successPublishing = document.querySelector('.successPublishing');

                    
                    var uid = this.storageManager.getUid();
                    if (!uid) {
                    }

                    boxNameEmail.setAttribute("class", "name-email undisplay");
                    boxPublishCancel.setAttribute("class", "publish-cancel undisplay");
                    boxPublishDone.setAttribute("class", "publish-done display");
                    
                    var outcomeRanking = document.getElementById('outcomeRanking');
                    outcomeRanking.innerHTML = '1<audio autoplay loop src="media/boring-cavern.mp3"></audio>';
                    successPublishing.setAttribute("class", "successPublishing shaking display");
                    outcome.setAttribute("class", "display");

                } else {
                    errorDesc.innerHTML = "enter a valid email";
                    errorPublishing.setAttribute("class", "errorPublishing display");
                    outcome.setAttribute("class", "display");
                }
            } else {
                errorDesc.innerHTML = "enter a valid name";
                errorPublishing.setAttribute("class", "errorPublishing display");
                outcome.setAttribute("class", "display");
            }
        } else {
            errorDesc.innerHTML = "need internet access";
            errorPublishing.setAttribute("class", "errorPublishing display");
            outcome.setAttribute("class", "display");
        }
    } else {
        errorDesc.innerHTML = "need a network connection";
        errorPublishing.setAttribute("class", "errorPublishing display");
        outcome.setAttribute("class", "display");
    }
}

// Show Publish score
GameManager.prototype.showPublishScore = function () {
    var modalContainer = document.getElementById('modalContainer');
    modalContainer.setAttribute("class", "display");
    var modalWindow = document.getElementById('modal');
    modalWindow.style.zIndex = 100;
    modalWindow.style.opacity = 1;
}

// Restart the game
GameManager.prototype.restart = function () {
  //if (this.actuator.timeout) { clearTimeout(this.actuator.timeout) };
  //if (this.actuator.chronoId) { clearInterval(this.actuator.chronoId) };
  this.storageManager.clearGameState();
  //this.actuator.continueGame(); // Clear the game won/lost message
  this.setup();
};

// Got it!
GameManager.prototype.gotIt = function () {
  this.actuator.continueGame(); // Clear the game won/lost message
};

// Keep playing after winning (allows going over 2048)
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.keepPlaying(); 
};

// Return true if the game is lost, or has won and the user hasn't kept playing
GameManager.prototype.isGameTerminated = function () {
  if (this.over || (this.won && !this.keepPlaying)) {
    return true;
  } else {
    return false;
  }
};

// Set up the game
GameManager.prototype.setup = function () {
    //this.actuator = new this.actuatorClass();
    this.actuator.setup();
    var previousState = this.storageManager.getGameState();

    // Reload the game from a previous game if present
    if (previousState) {
        this.grid        = new Grid(previousState.grid.size,
                                    previousState.grid.cells); // Reload grid
        this.chickValue = previousState.chickValue;
        this.chickCount = previousState.chickCount;
        this.previousChickValue = previousState.previousChickValue;
        this.score       = previousState.score;
        this.over        = previousState.over;
        this.won         = previousState.won;
        this.keepPlaying = previousState.keepPlaying;
    } else {
        this.grid = new Grid(this.size);
        this.chickCount = 0;
        this.previousChickValue = 8;
        this.chickValue = 8;
        this.score       = 0;
        this.over        = false;
        this.won         = false;
        this.keepPlaying = false;

        // Add the initial tiles
        this.addStartTiles();
    }

    // Update the actuator
    this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);
    tile.brandNew=true;
    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.storageManager.getBestScore() < this.score) {
    this.storageManager.setBestScore(this.score);
  }

  // Clear the state when the game is over (game over only, not win)
  if (this.over) {
    this.storageManager.clearGameState();
  } else {
    this.storageManager.setGameState(this.serialize());
  }

  this.actuator.actuate(this.grid, {
    chickCount: this.chickCount,
    chickValue: this.chickValue,
    previousChickValue: this.previousChickValue,
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.storageManager.getBestScore(),
    terminated: this.isGameTerminated()
  });

};

// Represent the current game as an object
GameManager.prototype.serialize = function () {
  return {
    grid: this.grid.serialize(),
    chickValue: this.chickValue,
    previousChickValue: this.previousChickValue,
    chickCount:      this.chickCount,
    score:       this.score,
    over:        this.over,
    won:         this.won,
    keepPlaying: this.keepPlaying
  };
};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2: down, 3: left
  var self = this;

  if (this.isGameTerminated()||this.actuator.messagePending) return; // Don't do anything if the game's over

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

		  // The mighty 2048kg egg
          if (merged.value === 2048){
			 merged.won = true;
		     self.won = true;
		  }
		  
          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;
          if (merged.value == self.chickValue) {
              self.chickCount++;
              self.previousChickValue = self.chickValue;
              self.chickValue *= 2;
          }

        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    this.addRandomTile();

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
    this.previousChickValue = this.chickValue;
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // Up
    1: { x: 1,  y: 0 },  // Right
    2: { x: 0,  y: 1 },  // Down
    3: { x: -1, y: 0 }   // Left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x == second.x && first.y == second.y;
};
