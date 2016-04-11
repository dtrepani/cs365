var socket = io();

//null if they haven't clicked on the first part of the move yet.
//an object with an x and y coordinate if they have clicked the first click (but not the 2nd yet).
var firstClick = null;

//number of pieces on the board - so that we know when one was captured and can play a sound.
var pieceCount = 0;
var lastGameMode; //Same thing - so we can detect when the game just ended.

function getRedTrayAt(x,y) {
	return getThingAt("#redTray", x, y);
}

function getBlueTrayAt(x,y) {
	return getThingAt("#blueTray", x, y);
}

function getMapAt(x,y) {
	return getThingAt("#map", x, y);
}

function getThingAt(theThing, x,y) {
	return $(theThing+" .row").eq(y).find(".cell").eq(x);
}

function highlight(whichArea, x, y) {
	// .eq filters it down to the element at the given index in the result set.
	getThingAt("#"+whichArea,x,y).css("background-color", "rgba(255,180,0,.5)");
}

function unhighlight(whichArea, x, y) {
	// .eq filters it down to the element at the given index in the result set.
	getThingAt("#"+whichArea,x,y).css("background-color", "");
}

function makeClickHandlerFor(whichArea,x,y) {
	var f = function() {
		//do something here
		if (firstClick == null) {
			firstClick = {whichArea: whichArea, x: x, y: y};
			highlight(whichArea, x, y);
		}
		else {
			var secondClick = {whichArea: whichArea, x: x, y: y};
			unhighlight(firstClick.whichArea, firstClick.x, firstClick.y);

			var obj = {firstClick: firstClick, secondClick: secondClick};

			socket.emit("move", obj);

			firstClick = null;
		}
	};

	return f;
}

function setThingsUp() {
	var x;
	var y;
	//Put event handlers in effect for all squares and all buttons.

	for(x = 0; x < 10; x++) {
		for(y = 0; y < 10; y++) {
			getMapAt(x,y).click(makeClickHandlerFor("map",x,y));
		}
	}

	for(x = 0; x < 4; x++) {
		for(y = 0; y < 10; y++) {
			getBlueTrayAt(x,y).click(makeClickHandlerFor("blueTray",x,y));
			getRedTrayAt(x,y).click(makeClickHandlerFor("redTray",x,y));
		}
	}

	$("#autoSetup").click(function() {
		socket.emit("autoSetup");
	});

	$("#sitRed").click(function() {
		socket.emit("sitAsRed");
	});

	$("#sitBlue").click(function() {
		socket.emit("sitAsBlue");
	});

	$("#standUp").click(function() {
		socket.emit("standUp");
	});

	$("#startGame").click(function() {
		socket.emit("readyToStart");
	});

	$("#clearGame").click(function() {
		socket.emit("readyToReset");
	});

	socket.on("gameState", function(gameState) {
		$("#sitRed").prop("disabled", gameState.redSeat);
		$("#sitBlue").prop("disabled", gameState.blueSeat);
		$("#startGame").prop("disabled", gameState.gameMode >= 1 || gameState.role == "spectator");
		$("#clearGame").prop("disabled", gameState.gameMode == 0 || gameState.role == "spectator");
		$("#autoSetup").prop("disabled", gameState.gameMode >= 1 || gameState.role == "spectator");
		$("#standUp").prop("disabled", gameState.role == "spectator");

		var role = (gameState.role == "spectator" ? "spectator" : "playing "+gameState.role);

		if (gameState.gameMode == 0)
			$("#gameStateDisplay").text("("+role+", setup)");
		else if (gameState.gameMode == 1 && gameState.redTurn)
			$("#gameStateDisplay").text("("+role+", red's turn)");
		else if (gameState.gameMode == 1 && !gameState.redTurn)
			$("#gameStateDisplay").text("("+role+", blue's turn)");
		else if (gameState.gameMode == 2 && gameState.redTurn)
			$("#gameStateDisplay").text("("+role+", blue wins)");
		else if (gameState.gameMode == 2 && !gameState.redTurn)
			$("#gameStateDisplay").text("("+role+", red wins)");

		if (lastGameMode <= 1 && gameState.gameMode == 2) {
			playTheSound("#gameOver");
		}
		lastGameMode = gameState.gameMode;

		playerDisplay("#blueSeatDisplay", gameState.blueSeat, gameState.blueReady, gameState.gameMode);
		playerDisplay("#redSeatDisplay", gameState.redSeat, gameState.redReady, gameState.gameMode);

		fillImagesInFor(gameState.gameMap, "#map");
		fillImagesInFor(gameState.blueTray, "#blueTray");
		fillImagesInFor(gameState.redTray, "#redTray");

		var newPieceCount = countPiecesInArea(gameState.gameMap);
		if (gameState.gameMode == 1 && newPieceCount < pieceCount) {
			if (Math.random() < .5) playTheSound("#capture1");
			else playTheSound("#capture2");
		}
		pieceCount = newPieceCount;

	});
}

function playTheSound(selector) {
	$(selector)[0].cloneNode(true).play();
}

function fillImagesInFor(whichArea, whichDOMElement) {
	for (var x = 0; x < whichArea.length; x++) {
		for (var y = 0; y < whichArea[x].length; y++) {
			//This finds all img elements inside that div (there is only one, though, which is good).
			var imgElement = getThingAt(whichDOMElement,x,y).find("img");
			var imgFile = imgFileFor(whichArea[x][y]);
			imgElement.attr("src", imgFile);
		}
	}

}

function imgFileFor(pieceObject) {
	if (pieceObject == null || pieceObject.owner=="nobody") return "img/gamepiecesSmall/blankgamepiece.png";

	var imgFileName = ".png";

	if (pieceObject.rank == "F")
		imgFileName = "flag" + imgFileName;
	else if (pieceObject.rank == "S")
		imgFileName = "spy" + imgFileName;
	else if (pieceObject.rank == "B")
		imgFileName = "bomb" + imgFileName;
	else
		imgFileName = pieceObject.rank + imgFileName;

	imgFileName = pieceObject.owner + imgFileName;

	return "img/gamepiecesSmall/" + imgFileName;
}

function playerDisplay(whichDOMElement, seated, ready, gameMode) {
	var str = "";
	if (seated)
		str = str + "(occupied)";
	else
		str = str + "(empty)";

	if (ready && gameMode==0)
		str = str + " READY TO START";
	else if (ready && gameMode >= 0)
		str = str + " REQUESTS RESTART";

	$(whichDOMElement).text(str);
}

function countPiecesInArea(whichArea) {
	var count = 0;
	for (var x = 0; x < whichArea.length; x++) {
		for (var y = 0; y < whichArea[x].length; y++) {
			if (whichArea[x][y] != null) {
				count++;
			}
		}
	}
	return count;
}

$(setThingsUp);



