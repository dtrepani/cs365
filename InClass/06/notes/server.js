
var express = require("express");
var app = express();

var http = require("http");
var server = http.Server(app);

var socketio = require("socket.io");
var io = socketio(server);

app.use(express.static("pub"));

var gameMode; //0=setup mode, 1=game in play, 2=game over
var redSeat; //null means nobody is seated.  Otherwise, reference to the socket object.
var blueSeat; //null means nobody is seated.  Otherwise, reference to the socket object.
var blueReady; //ready for starting game or reseting the game, depending on gameMode.
var redReady;
var redTurn;
var revealedPiece; //Coordinates of a piece that is visible to all parties.  null if no such piece is shown.

var gameMap;
var blueTray;
var redTray;

function resetGame() {
	gameMode = 0;
	blueReady = false;
	redReady = false;
	redTurn = false;
	revealedPiece = null;

	gameMap = make2DArrayOfNulls(10, 10);
	blueTray = make2DArrayOfNulls(4, 10);
	redTray = make2DArrayOfNulls(4, 10);

	//A little hack to make the lakes work.
	var nobody = {owner: "nobody", rank: ""};
	gameMap[2][4] = nobody;
	gameMap[3][4] = nobody;
	gameMap[6][4] = nobody;
	gameMap[7][4] = nobody;
	gameMap[2][5] = nobody;
	gameMap[3][5] = nobody;
	gameMap[6][5] = nobody;
	gameMap[7][5] = nobody;

	fillTray(blueTray, false);
	fillTray(redTray, true);
}

function existsValidMove() {
	var owner = (redTurn ? "red" : "blue");

	for(var x = 0; x < gameMap.length; x++) {
		for(var y = 0; y < gameMap[x].length; y++) {
			for(var dx = -1; dx <= 1; dx++) {
				for(var dy = -1; dy <= 1; dy++) {
					if (dx != 0 && dy != 0) continue; //can't go diagonally.
					if (dx == 0 && dy == 0) continue; //can't stay there.

					var clicks = {firstClick: {whichArea: "map", x: x, y: y}, secondClick: {whichArea: "map", x: x+dx, y: y+dy}};
					if (validMove(clicks, owner)) return true;
				}
			}
		}
	}
	return false;
}

function validMove(clicks, owner) {
	var x1 = clicks.firstClick.x;
	var y1 = clicks.firstClick.y;
	var x2 = clicks.secondClick.x;
	var y2 = clicks.secondClick.y;

	if (x1 < 0 || x1 >= 10) return false;
	if (y1 < 0 || y1 >= 10) return false;
	if (x2 < 0 || x2 >= 10) return false;
	if (y2 < 0 || y2 >= 10) return false;

	var otherPlayerColor = oppositeColor(owner);

	//Can't click on the trays.
	if (!onMap(clicks.firstClick) || !onMap(clicks.secondClick)) return false;

	//can't move anything except your own pieces.
	if (gameMap[x1][y1] == null || gameMap[x1][y1].owner != owner) return false;

	//can only move to blank or piece owned by other player
	if (gameMap[x2][y2] != null && gameMap[x2][y2].owner != otherPlayerColor) return false;

	//must only move on your turn
	if (owner == "red" && !redTurn) return false;
	if (owner == "blue" && redTurn) return false;

	//No moving bombs or flag.
	if (gameMap[x1][y1].rank == "F") return false;
	if (gameMap[x1][y1].rank == "B") return false;

	//scouts move like rooks in chess, but they can only do that
	//if they are moving into an empty square
	if (gameMap[x1][y1].rank == 9 && gameMap[x2][y2] == null) {
		var dx; //change in x
		var dy; //change in y
		if (x1 == x2) {
			dx = 0;
			if (y1 < y2) dy = 1;
			else if (y1 > y2) dy = -1;
			else return false; //can't move to same spot.
		}
		else if (y1 == y2) {
			dy = 0;
			if (x1 < x2) dx = 1;
			else if (x1 > x2) dx = -1;
			else return false; //can't move to same spot.
		}

		//Now check that the path is clear...
		var px = x1 + dx;
		var py = y1 + dy;
		while(!(px == x2 && py == y2)) {
			if (gameMap[px][py] != null) return false; //can't move through a piece (or water)

			px += dx;
			py += dy;
		}
	}
	//Everything else only moves one square at a time
	else {
		if (Math.abs(x1-x2) + Math.abs(y1-y2) != 1) return false;
	}

	//if we got this far, it is a valid move...
	return true;
}

function putInTray(x1, y1) {
	var whichTray;

	if (gameMap[x1][y1].owner == "red") whichTray = redTray;
	else if (gameMap[x1][y1].owner == "blue") whichTray = blueTray;
	else return;

	for(var x = 0; x < whichTray.length; x++) {
		for(var y = 0; y < whichTray[x].length; y++) {
			if (whichTray[x][y] == null) {
				whichTray[x][y] = gameMap[x1][y1];
				gameMap[x1][y1] = null;
				return;
			}
		}
	}
}

function winsOver(attackerRank, defenderRank) {
	if (defenderRank == "B") {
		return (attackerRank == 8);
	}
	if (defenderRank == "F") {
		return true;
	}
	if (defenderRank == "S") {
		return true;
	}

	if (attackerRank == "S") {
		return (defenderRank == 1);
	}

	return (attackerRank < defenderRank);

}

function oppositeColor(color) {
	if (color == "red") return "blue";
	if (color == "blue") return "red";
	return "spectator";
}

function onBlueTray(click) {
	return (click.whichArea == "blueTray");
}

function onMap(click) {
	return (click.whichArea == "map");
}

function onRedTray(click) {
	return (click.whichArea == "redTray");
}

function getArrayFor(click) {
	if (onMap(click)) return gameMap;
	else if (onBlueTray(click)) return blueTray;
	else if (onRedTray(click)) return redTray;
	else return null; //shouldn't happen...
}

function swap(clicks) {
	if (getArrayFor(clicks.firstClick) == null || getArrayFor(clicks.secondClick) == null) return;

	var temp = getArrayFor(clicks.firstClick)[clicks.firstClick.x][clicks.firstClick.y];

	getArrayFor(clicks.firstClick)[clicks.firstClick.x][clicks.firstClick.y] =
		getArrayFor(clicks.secondClick)[clicks.secondClick.x][clicks.secondClick.y];

	getArrayFor(clicks.secondClick)[clicks.secondClick.x][clicks.secondClick.y] = temp;
}

function onBlueSideOfMapOrBlueTray(click) {
	if (onBlueTray(click)) return true;
	else if (onRedTray(click)) return false;
	else return (click.y <= 3);
}

function onRedSideOfMapOrRedTray(click) {
	if (onRedTray(click)) return true;
	else if (onBlueTray(click)) return false;
	else return (click.y >= 6);
}

function make2DArrayOfNulls(width, height) {
	var m = [];
	for(var x = 0; x < width; x++) {
		m[x] = [];
		for(var y = 0; y < height; y++) {
			m[x][y] = null;
		}
	}
	return m;
}

function is2DArrayAllNull(myArray) {
	for(var x = 0; x < myArray.length; x++) {
		for(var y = 0; y < myArray[x].length; y++) {
			if (myArray[x][y] != null) return false;
		}
	}
	return true;
}

function fillTray(whichTray, isRed) {
	var guys = ["S", "B", "B", "B", "B", "B", "B", "F", 1, 2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9];
	for(var x = 0; x < whichTray.length; x++) {
		for(var y = 0; y < whichTray[x].length; y++) {
			whichTray[x][y] = {};
			whichTray[x][y].rank = guys[x + y * whichTray.length];
			whichTray[x][y].owner = (isRed ? "red" : "blue");
		}
	}
}

function getGameState(showRed, showBlue, role) {
	var ret = {};
	ret.gameMode = gameMode;
	ret.redSeat = (redSeat != null); //true if there is someone there, false ow.
	ret.blueSeat = (blueSeat != null); //true if there is someone there, false ow.
	ret.blueReady = blueReady;
	ret.redReady = redReady;
	ret.redTurn = redTurn;
	ret.role = role;

	//Need to copy over the map object and trays.  Here is how:
	ret.gameMap = JSON.parse(JSON.stringify(gameMap));
	ret.blueTray = JSON.parse(JSON.stringify(blueTray));
	ret.redTray = JSON.parse(JSON.stringify(redTray));

	//Now censor the data if need be.
	for(var x = 0; x < ret.gameMap.length; x++) {
		for(var y = 0; y < ret.gameMap[x].length; y++) {
			//If it is a revealed piece, then don't bother to conceal it.
			if (revealedPiece != null && x==revealedPiece.x && y==revealedPiece.y) continue;

			if (ret.gameMap[x][y] != null && ret.gameMap[x][y].owner == "red" && !showRed) {
				ret.gameMap[x][y].rank = ""; //hide the rank.
			}
			if (ret.gameMap[x][y] != null && ret.gameMap[x][y].owner == "blue" && !showBlue) {
				ret.gameMap[x][y].rank = ""; //hide the rank.
			}
		}
	}

	return ret;
}

function sendGameStateToClients() {
	if (redSeat != null) redSeat.emit("gameState", getGameState(true, false, "red"));
	if (blueSeat != null) blueSeat.emit("gameState", getGameState(false, true, "blue"));
	io.in("spectator").emit("gameState", getGameState(false, false, "spectator"));
}

io.on("connect", function(socket) {
	console.log("Client connected");
	socket.join("spectator");
	sendGameStateToClients();

	socket.on("disconnect", function() {
		console.log("Client disconnected");
		if (redSeat == socket) redSeat = null;
		else if (blueSeat == socket) blueSeat = null;
		else socket.leave("spectator");

		sendGameStateToClients();
	});

	socket.on("sitAsBlue", function() {
		if (blueSeat == null) {
			blueSeat = socket;
			if (redSeat == socket) { //make sure they aren't hogging both seats.
				redSeat = null;
			}
			else {
				socket.leave("spectator");
			}
		}

		sendGameStateToClients();
	});

	socket.on("sitAsRed", function() {
		if (redSeat == null) {
			redSeat = socket;
			if (blueSeat == socket) { //make sure they aren't hogging both seats.
				blueSeat = null;
			}
			else {
				socket.leave("spectator");
			}
		}

		sendGameStateToClients();
	});

	socket.on("standUp", function() {
		if (redSeat == socket) {
			redSeat = null;
			socket.join("spectator");
		}
		if (blueSeat == socket) {
			blueSeat = null;
			socket.join("spectator");
		}

		sendGameStateToClients();
	});

	socket.on("readyToReset", function() {
		if (gameMode >= 1) {
			//set that player's reset variable
			if (socket == blueSeat) blueReady = true;
			if (socket == redSeat) redReady = true;

			//if both reset variables are set, clear them both and reset the game.
			if (blueReady && redReady) {
				resetGame();
			}
			sendGameStateToClients();
		}
	});

	socket.on("autoSetup", function() {
		if (socket == blueSeat && gameMode == 0) {
			whichTray = blueTray;
		}
		else if (socket == redSeat && gameMode == 0) {
			whichTray = redTray;
		}
		else {
			return;
		}

		var toPlace = [];
		for(var x = 0; x < whichTray.length; x++) {
			for(var y = 0; y < whichTray[x].length; y++) {
				if (whichTray[x][y] != null) {
					toPlace.push(whichTray[x][y]);
					whichTray[x][y] = null;
				}
			}
		}

		//Shuffle everything.
		for(var i = 0; i < toPlace.length - 1; i++) {
			var j = i + Math.floor(Math.random() * (toPlace.length - i));
			var temp = toPlace[i];
			toPlace[i] = toPlace[j];
			toPlace[j] = temp;
		}

		var startY = (whichTray == redTray ? 6 : 0);
		for(var x = 0; x < gameMap.length; x++) {
			for(var y = startY; y < startY + 4; y++) {
				if (gameMap[x][y] == null) {
					gameMap[x][y] = toPlace.pop();
				}
			}
		}
		sendGameStateToClients();
	});

	socket.on("move", function(clicks) {
		//game mode 0
		if (gameMode == 0) {
			//Both endpoints must be that player's tray or the map.
			//The map coordinates must be on their side of the board.
			if (!blueReady && socket == blueSeat && onBlueSideOfMapOrBlueTray(clicks.firstClick) && onBlueSideOfMapOrBlueTray(clicks.secondClick)) {
				swap(clicks);
			}
			if (!redReady && socket == redSeat && onRedSideOfMapOrRedTray(clicks.firstClick) && onRedSideOfMapOrRedTray(clicks.secondClick)) {
				swap(clicks);
			}
			sendGameStateToClients();
		}
		//Game mode 1
		else if (gameMode == 1) {
			var x1 = clicks.firstClick.x;
			var y1 = clicks.firstClick.y;
			var x2 = clicks.secondClick.x;
			var y2 = clicks.secondClick.y;

			var owner;
			if (socket == blueSeat) owner = "blue";
			else if (socket == redSeat) owner = "red";
			else owner = "nobody";

			if (!validMove(clicks,owner)) return;


			//Whenever there is a move, we clear any reset requests.
			blueReady = false;
			redReady = false;

			if (gameMap[x2][y2] == null) { //regular move
				swap(clicks);
				revealedPiece = null;
			}
			else if (gameMap[x1][y1].rank == gameMap[x2][y2].rank) { //a tie
				putInTray(x1, y1);
				putInTray(x2, y2);
				revealedPiece = null;
			}
			else if (winsOver(gameMap[x1][y1].rank, gameMap[x2][y2].rank)) {//first one wins
				//If the defending piece is the flag, then it is game over.
				if(gameMap[x2][y2] != null && gameMap[x2][y2].rank == "F") {
					gameMode = 2;
				}

				putInTray(x2, y2);
				swap(clicks);
				revealedPiece = {x: x2, y: y2};
			}
			else {//second one wins
				putInTray(x1, y1);
				if (gameMap[x2][y2].rank != "B") {
					swap(clicks);
					revealedPiece = {x: x1, y: y1};
				}
				else {
					revealedPiece = {x: x2, y: y2};
				}
			}
			redTurn = !redTurn;

			//Now check to see if it is game over due to a player not having a move on their turn...
			if (!existsValidMove()) {
				gameMode = 2;
			}

			sendGameStateToClients();
		}
		else if (gameMode == 2) {
			//Game mode 2
			//Either no legal moves available or flag is captured.
		}

	});

	socket.on("readyToStart", function() {
		//Check to see that their tray is empty, and gameMode = 0
		if (gameMode != 0) return;
		if (redSeat == socket && is2DArrayAllNull(redTray)) redReady = true;
		if (blueSeat == socket && is2DArrayAllNull(blueTray)) blueReady = true;

		//if both are ready, start the game.
		if (redReady && blueReady) {
			redTurn = (Math.random() < .5); //random first player.
			gameMode = 1;
			redReady = false;
			blueReady = false;
			if (!existsValidMove()) { //Just in case someone put all bombs in the front row :)
				gameMode = 2;
			}
		}

		//TODO: If/when we put in the timeout feature, if someone neglected to put some pieces (especially the flag) on the board, we have to put it there.
		sendGameStateToClients();
	});

});


//Stuff to do when it starts:
redSeat = null;
blueSeat = null;
resetGame();
server.listen(80, function() {
	console.log("Server is listening.");
});


