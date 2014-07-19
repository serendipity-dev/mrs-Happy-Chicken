function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer = document.querySelector(".score-container");
  this.timeContainer = document.querySelector(".time-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.setup();
}

HTMLActuator.prototype.setup = function () {
     
    if (this.timeout) { clearTimeout(this.timeout) };
    if (this.chronoId) { clearInterval(this.chronoId) };
    this.timeElapsed = 0;
    this.chronoId = 0;
    this.score = 0;
    this.chickValue = 8;
    this.previousChickValue = 8;
    this.chickCount = 0;
    this.babiesImageCount = document.getElementById("babiesCount");
    this.babiesImageCount.src = "images/babies.png";
    this.clearMessage();
    this.clearScorePublishing();
    this.chronoStart(new Date());
}

HTMLActuator.prototype.chronoStart = function (date) {
    var start = date;
    var end = 0;
    var self = this;

    this.chronoStop();
    this.chronoId = setInterval(function () {
        end = new Date();
        self.timeElapsed = end - start;
        self.timeElapsed = new Date(self.timeElapsed);
        var msec = self.timeElapsed.getMilliseconds();
        var sec = self.timeElapsed.getSeconds();
        var min = self.timeElapsed.getMinutes();
        var hr = self.timeElapsed.getHours() - 1;
        if (min < 10) {
            min = "0" + min;
        }
        if (sec < 10) {
            sec = "0" + sec;
        }
        if (msec < 10) {
            msec = "00" + msec;
        }
        else if (msec < 100) {
            msec = "0" + msec;
        }
        self.timeContainer.innerHTML = hr + ":" + min + ":" + sec;
    }, 10);
}

HTMLActuator.prototype.chronoContinue = function() {
    var date = new Date() - this.timeElapsed;
    date = new Date(date);
    this.chronoStart(date);
}

HTMLActuator.prototype.chronoStop = function() {
    clearInterval(this.chronoId)
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;
  var chickGotten=false;
  self.chickValue = metadata.chickValue;
  self.previousChickValue = metadata.previousChickValue;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
          if (cell.value == self.previousChickValue) {
    		  grid.removeTile(cell);
			  chickGotten=true;
		  }
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateChickCount(metadata.chickCount);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
        if (metadata.over) {
          self.message(1); // You lose
		  self.timeout = setTimeout(function(){
		  self.clearContainer(self.tileContainer);

		  grid.cells.forEach(function (column) {
			  column.forEach(function (cell) {
				if (cell) {
				  cell.value=metadata.chickValue;
				  self.addTile(cell);
				}
			  });
		  });
		}, 3000);
      } else if (metadata.won) {
        self.message(0); // You win!
      }
    } else if (chickGotten) {
	  self.babiesImageCount.src="images/babies-"+metadata.chickCount+".png";
	  if(!hideMsgs){
		self.message(2);
	  }
	}

  });
};

// Continues the game (after chickGottenMessages)
HTMLActuator.prototype.continueGame = function () {
    this.clearMessage();
    this.chronoContinue();
};

// Continues the game (after keep playing choice)
HTMLActuator.prototype.keepPlaying = function () {
    this.clearMessage();
    this.chronoContinue();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  //inner.textContent = tile.value+;
  if(tile.value!=self.previousChickValue){
     inner.innerHTML = '<img src="images/'+tile.value+'.png" />';
  } else {
      if (!hideSnds) {
          inner.innerHTML = '<div class="crack"><audio autoplay src="media/little-chicken.mp3"></audio></div>';
      } else {
          inner.innerHTML = '<div class="crack"></div>';
      }
  }
  
  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    if(tile.brandNew){
      classes.push("tile-new");
      if (!hideSnds) {
          inner.innerHTML = '<div class="uack' + tile.value + '"><audio autoplay src="media/chicken.mp3"></audio></div>';
      } else {
          inner.innerHTML = '<div class="uack' + tile.value + '"></div>';
      }
	  //inner.classList.remove("tile-inner");
	  //inner.classList.add("uack");
	}else{
	  classes.push("tile-new");
	};
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};


HTMLActuator.prototype.updateChickCount = function (chickCount) {
    var difference = chickCount - this.chickCount;
    this.chickCount = chickCount;

    if (difference > 0) {
        this.babiesImageCount.src = "images/babies-" + this.chickCount + ".png";
    }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (code) {
  var type=null;
  var message=null;
  var subMessage=null;
  
  switch(code){
	case 0: 
	    type="game-won";
		message="You win!";
	break;
	case 1: 
	    type="game-over";
		message="Game over!";
		if(this.chickCount==0){
			subMessage="(and you got no baby chickens...)";
		}else if (this.chickCount<=3){
			subMessage="(and you got "+this.chickCount+" baby chickens)";
		}else{
			subMessage="(but you got "+this.chickCount+" baby chickens!)";
		}
	break;
	case 2:
    default:	
	    type="got-chick";
		message="You've got a baby chicken!";
		subMessage="(get the next with a " + this.chickValue + "Kg egg)";
	break;
  }

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
  if(subMessage){
     this.messageContainer.getElementsByTagName("p")[1].textContent = subMessage;
  }
  this.messagePending = true;
  this.chronoStop();
};


HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
    if (this.messageContainer.classList.contains("game-won")) {
        this.messageContainer.classList.remove("game-won");
    };
 
    if (this.messageContainer.classList.contains("game-over")) {
        this.messageContainer.classList.remove("game-over");
    };

    if (this.messageContainer.classList.contains("got-chick")) {
        this.messageContainer.classList.remove("got-chick");
    };

    this.messageContainer.getElementsByTagName("p")[0].textContent = "";
    this.messageContainer.getElementsByTagName("p")[1].textContent = "";
    this.messagePending=false;
};

HTMLActuator.prototype.clearScorePublishing = function () {
    var outcome = document.getElementById('outcome');
    var errorPublishing = document.querySelector('.errorPublishing');
    var modalContainer = document.getElementById('modalContainer');
    var boxNameEmail = document.querySelector('.name-email');
    var boxPublishCancel = document.querySelector('.publish-cancel');
    var boxPublishDone = document.querySelector('.publish-done');
    var successPublishing = document.querySelector('.successPublishing');
    var outcomeRanking = document.getElementById('outcomeRanking');

    outcomeRanking.innerHTML = "1";
    boxNameEmail.setAttribute("class", "name-email display");
    boxPublishCancel.setAttribute("class", "publish-cancel display");
    boxPublishDone.setAttribute("class", "publish-done undisplay");
    successPublishing.setAttribute("class", "successPublishing shaking undisplay");
    errorPublishing.setAttribute("class", "errorPublishing undisplay");
    outcome.setAttribute("class", "undisplay");
    modalContainer.setAttribute("class", "undisplay");
};


