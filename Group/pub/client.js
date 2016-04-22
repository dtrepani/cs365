var socket = io();
var myUsername = "myUsername"
var myRoomNumber;
var myState = "waiting";
var imagesLoaded = 0;
var cardImages;
var myCards =[];
var myNumberOfCards =6;
var cards = [];
var opponents = [];
var trump;
var backCard;
var canvas;
var ctx;
var canPlay = false;
var highlightedCard = -1;
var canvasW = 1280;
var canvasH = 720;
var attackingCardsInPlay = [];
var defendingCardsInPlay = [];
var btns = [];
var slotIndex = 0;
var numberOfCardsInDeck;
function doThisWhenLoaded() {
	console.log("generateCards");
	generateCardImages();
}

function doTheRestOfThisWhenLoaded() {
	showLoginScreen();
	
	$("#loginButton").click(function() {
		socket.emit("login", $("#username").val());
	});

	$("#readyBtn").click(function() {
		updateStateText();
	});

	$("#exitRoomBtn").click(function() {
		$("#waitDiv").hide();
		$("#msgRoom").hide();
		socket.emit("exitRoom", myRoomNumber);
	});
	$("#playAgain").click(function() {
		$("#modalDiv").css("display", "none");
		showRoomScreen();
		socket.emit("exitRoom", myRoomNumber);

	});
	socket.on("joinedSuccessfully", function(roomNumber) {
		$("#waitDiv").show();
		$("#userInRoomText").text("You are in room #" + roomNumber);
		$("#readyBtn").text("ready");
		myRoomNumber = roomNumber;
	});
	socket.on("statsForPlayer", function(data)
	{
		console.log("states");
		console.log(data);
	});

	socket.on("lockRoom", function(roomNumber) {
		$("#lock"+roomNumber+"room").css("visibility",  "visible");
		$("#roomDiv .room").eq(roomNumber).find(".joinBtn").prop("disabled",true);
		$("#roomDiv .room").eq(roomNumber).find(".joinBtn").hide();
		$("#roomDiv .room").eq(roomNumber).find(".joinBtn").css("visibility",  "visible");
		
	});

	socket.on("nameExists", function(name) {
		$("#nameWarning").text("Choose other name");
	});

	socket.on("removedSuccessfully", function(roomNumber) {
		$("#waitDiv").hide();
	});

	/**
	* @see Room->getDataForPlayer().
	*/
	socket.on("sendData", function(data) {
		updateData(data);
		ctx.clearRect(0, 0, canvasW, canvasH);
		drawEverything();
		
	});

	socket.on("sendMessage", function(msg) {
		$("#msgRoom").show();
		$("#msgRoom").text(msg);
	});

	socket.on("showRooms", function(username) {
		showRoomScreen();
		socket.emit("getStatsForPlayer", myUsername);
	});
	socket.on("statsForPlayer", function(result)
	{
		console.log(result);
		$("#name").text("username: " + myUsername);
		$("#name").text("games played: " + result.gamesPlayed);
		$("#name").text("games won: " + result.gamesWon);
	});

	socket.on("startGame", function(usersInRoom) {
		showMainScreen();
	});

	socket.on("updateRooms", function(usersInRooms) {
		updateRoomsInfo(usersInRooms);
	});
	socket.on("endGame", function(result)
	{
		console.log(result);
	});
	socket.on("gameOver", function(wonGame)
	{
		if(wonGame == true)
		{
			showModalScreen("YOU ARE THE BEST!");
		}
		else
		{
			showModalScreen("YOU SUCK!");
		}
	});
	
	for(i = 0; i < 6; ++i) {
		$("#roomDiv .room").eq(i).find(".joinBtn").click(makeClickHandlerFor(i));
	}

	$("#canv").click(makeCanvasHandler);
	
}

function updateRoomsInfo(usersInRooms) {
	var r, p;
	for(r = 0; r < 6; ++r) {
		for(p = 0; p < usersInRooms[r].length; ++p) {
			$("#r" + (r+1) + "p" + (p+1)).text(usersInRooms[r][p]);
		}
		while(p < 4) {
			$("#r" + (r+1) + "p" + (p+1)).text("...");
			++p
		}
	}
}

function makeClickHandlerFor(roomNumber) {
	return function() {
		socket.emit("join", roomNumber);
	};
}

function showLoginScreen() {
	$("#nameWarning").text("");
	$("#loginDiv").show();
	$("#waitDiv").hide();
	$("#mainDiv").hide();
	$("#roomSection").hide();
}

function showRoomScreen() {
	$("#nameWarning").text("");
	$("#loginDiv").hide();
	$("#mainDiv").hide();
	$("#roomSection").show();
	$("#waitDiv").hide();
}

function showMainScreen() {
	
	canvas = $("canvas")[0];
	canvas.width = canvasW;
	canvas.height = canvasH;
	ctx = canvas.getContext('2d');
	$("#titleName").hide();
	$("#loginDiv").hide();
	$("#waitDiv").hide();
	$("#roomSection").hide();
	$("#mainDiv").show();
}
function updateStateText() {
	if (myState === "waiting") {
		myState = "ready";
		$("#readyBtn").text("not ready");
	} else {
		myState = "waiting";
		$("#readyBtn").text("ready");
	}
	socket.emit("changeState", myState);
}
function updateData(data) {
	console.log(data);
	
	attackingCardsInPlay = [];
	defendingCardsInPlay = [];
	myCards = [];
	
	console.log("getData");
	for(var i = 0; i < data.cards.length; ++i)  {
		myCards[myCards.length] = findCard(data.cards[i].suit, data.cards[i].number);
	}	
	for(i = 0; i < data.cardsInPlay.attacking.length; ++i) {
		attackingCardsInPlay[i] = findCard(data.cardsInPlay.attacking[i].suit, data.cardsInPlay.attacking[i].number);
	}
	for(i = 0; i < data.cardsInPlay.defending.length; ++i) {
		if(data.cardsInPlay.defending[i] !== null) {
			defendingCardsInPlay[i] = findCard(data.cardsInPlay.defending[i].suit, data.cardsInPlay.defending[i].number);
		}
	}
	numberOfCardsInDeck = data.numberOfCardsInDeck;
	myUsername = data.myUsername;
	myState = data.state;
	trump = findCard(data.trump.suit, data.trump.number);
	opponents = data.opponentData;
}

function findCard(suit, number) {
	var i; 
	var j;
	for (i = 0; i < 4; ++i) {
		for(j =0; j < 9; ++j) {
			if(cards[i][j].suit == suit && j+6 == number)
				return cards[i][j];
		}
	}
}

function makeCanvasHandler(e) {
	var cardW = 110;
	var cardH = 160;
	e.preventDefault();
	var x = e.pageX;
	var y = e.pageY;
	for(var i = 0; i < myCards.length; ++i) {	
		if(x <= (myCards[i].x + cardW) && x >= myCards[i].x && 
			y <= (myCards[i].y + cardH) && y >=myCards[i].y ) {
			if(checkIfCanPlayCard(myCards[i])) {
				socket.emit("playCard", {roomNumber: myRoomNumber, 
										cardIndex: i, 
										slotIndex: slotIndex});
			}
		}
	}
	for(i = 0; i < 2; ++ i) {
		if( x <= (btns[i].x + btns[i].w) && x >= btns[i].x && 
			y <= (btns[i].y + btns[i].h) && y >=btns[i].y ) {
			if(checkIfButtonEnabled(btns[i]))
				socket.emit(btns[i].name, myRoomNumber)
		}
	}
}

function clickCanvas() {
	var ev = $._data($("canvas")[0], 'events');
	if(!(ev && ev.click)) 
	{
		$("#canv").click(function(e)
		{
			console.log("clicked");
			
			var cardW = 110;
			var cardH = 160;
			e.preventDefault();
			var x = e.pageX;
			var y = e.pageY;
			
			for(var i = 0; i < myCards.length; ++i)
			{	
				
				if(x <= (myCards[i].x + cardW) && x >= myCards[i].x && 
					y <= (myCards[i].y + cardH) && y >=myCards[i].y )
				{
					if(checkIfCanPlayCard(myCards[i]))
					{
						socket.emit("playCard", {roomNumber: myRoomNumber, 
											cardIndex: i, 
											slotIndex: slotIndex});
						checkIfWin();
						console.log("emitPlayCard");
						
					}
				}
			}
			for(i = 0; i < 2; ++ i)
			{
				if( x <= (btns[i].x + btns[i].w) && x >= btns[i].x && 
					y <= (btns[i].y + btns[i].h) && y >=btns[i].y )
				{
					if(checkIfButtonEnabled(btns[i]))
						socket.emit(btns[i].name, myRoomNumber)
				}
			}
		}, false);
	}
}
function showModalScreen(msg)
{
	$("#modalDiv").css("display", "block");
	var h = $(window).height() / 2;
	$("#modalWindow").css("height", h+"px");
	$("#modalWindow").css("margin-top", h/2+"px");
	$("#resultText").text(msg);
}
"modalDiv"
function checkIfWin() {
	if(numberOfCardsInDeck == 0 && myCards.length == 0)
	{
		socket.emit("winGame",  myRoomNumber);
	}
}
function checkIfButtonEnabled(btn) {
	if(btn.name == "discard" && myState == "attacking")
	{
		for(var i = 0; i < defendingCardsInPlay.length; ++i)
		{
			if(defendingCardsInPlay[i] === undefined)
				return false;
		}
		return true;
	}
	else if (btn.name == "takeCards" && myState == "defending")
	{
		if(attackingCardsInPlay.length > 0)
			return true
		
		return false;
	}
}

function checkIfCanPlayCard(card) {
	var i;
	if(myState == 'attacking' && attackingCardsInPlay.length == 0)
		return true;
	if(myState == 'attacking' || myState == 'supporting') {
		for(i = 0; i < attackingCardsInPlay.length; ++ i) {
			if(attackingCardsInPlay[i].number == card.number) {
				slotIndex = attackingCardsInPlay.length;
				return true;
			}
		}
		for(i = 0; i < defendingCardsInPlay.length; ++i) {
			if(defendingCardsInPlay[i] !== null && defendingCardsInPlay[i].number == card.number) {
				slotIndex = attackingCardsInPlay.length;
				return true;
			}
		}
		return false;
	}
	if(myState == 'defending') {
		for(i = 0; i < attackingCardsInPlay.length; ++ i) {
			if(defendingCardsInPlay[i] === undefined && (
			(attackingCardsInPlay[i].number < card.number && 
			attackingCardsInPlay[i].suit == card.suit) ||
			(card.suit == trump.suit))) {
				slotIndex = i;
				return true;
			}
		}
		return false;
	}
}

function generateCardImages() {
	var i; 
	var j;
	var suits = ["hearts", "diamonds", "spades", "clubs"];
	var tn = ['6','7','8','9', '10','jack','queen', 'king','ace'];
	var w = 150;
	var h = 210;
	cards = new Array(4);
	for (i = 0; i < 4; ++i) {
		cards[i] = new Array(9);
		for(j =0; j < 9; ++j)
		{
			var k = new Image();
			k.src = ("cards/" + tn[j] +"_of_" + suits[i]+".png");
			k.addEventListener("load", imageCounter);
			
			var card = {
				x : 0,
				y : 0,
				img: k,
				suit : suits[i],
				number : j+6,
				highlighted: false
			};
			cards[i][j] = card;
		}
	}
	
	var takeBtn = new Image();
	takeBtn.src = "Take.png";
	var discardBtn = new Image();
	discardBtn.src = "Discard.png";
	btns[0] = {name: "takeCards", img: takeBtn, x: 1100,y:600,  w: 87, h: 46};
	btns[1] = {name: "discard", img: discardBtn, x: 1100,y:650, w: 111,h: 46};
}

function imageCounter() {
	imagesLoaded++;
	if (imagesLoaded == cards.length) {
		doTheRestOfThisWhenLoaded();
	}
}

/* Draw stuff */

function drawEverything() {
	drawMyCards();
	drawDeck();
	drawOpponents();
	drawSlots();
}

function drawSlots() {
	
	var contW = canvasW /2 ; // 320 
	var contH = canvasH/3;
	var contX = canvasW / 5;
	var contY =  canvasH /2 - contH/2;

	var distance = contW;
	if(attackingCardsInPlay.length != 0 || attackingCardsInPlay.length !== undefined)
	{
		distance = contW/attackingCardsInPlay.length;
	}
	for(var t = 0; t < attackingCardsInPlay.length; ++t)
	{
		attackingCardsInPlay[t].x = contX + t*distance ;
		attackingCardsInPlay[t].y = contY ;
		ctx.drawImage(attackingCardsInPlay[t].img, attackingCardsInPlay[t].x , attackingCardsInPlay[t].y, 110, 160);
	}
	for( t = 0; t < defendingCardsInPlay.length; ++t)
	{
		defendingCardsInPlay[t].x = contX + t*distance + 20;
		defendingCardsInPlay[t].y = contY + 20;
		ctx.drawImage(defendingCardsInPlay[t].img, defendingCardsInPlay[t].x , defendingCardsInPlay[t].y, 110, 160);
	}
}

function drawMyCards() {
		var contX = canvasW / 5; // 320
		var contY = canvasH - 160;
		var contW = canvasW / 2 + 50;
		var contH = 160;
		ctx.font = "25px Arial";
		ctx.fillText(myUsername + ": " + myState,contX,contY - 15);

		var distance = contW/myCards.length;
		for(var t = 0; t < myCards.length; ++t)
		{
			myCards[t].x = contX + t*distance;
			myCards[t].y = contY;
			ctx.drawImage(myCards[t].img, myCards[t].x , myCards[t].y, 110, 160);
		}
	
		ctx.drawImage(btns[0].img, btns[0].x, btns[0].y);
		ctx.drawImage(btns[1].img, btns[1].x, btns[1].y);
}

function drawDeck() {
	backCard = new Image();
	backCard.src = "cards/b.png";
	emptySign = new Image();
	emptySign.src = "x.png";
	backCard.addEventListener("load", function() {
		var contW = canvasW / 10;
		var contH = 160;
		var contX = canvasW - contW; // 320
		var contY =  canvasH /2 - contH/2;

		if(numberOfCardsInDeck >=2)
		{
			for(var i= 1; i < numberOfCardsInDeck; ++i)
			{
				ctx.drawImage(backCard, contX+i, contY,110,160);
			}
			ctx.drawImage(trump.img, contX-100, contY,110,160);
		}else if(numberOfCardsInDeck == 1)
		{
			ctx.drawImage(trump.img, contX-100, contY,110,160);
			ctx.drawImage(emptySign, contX, contY + 20)
		}
		else
		{
			ctx.drawImage(emptySign, contX-100, contY + 20)
			ctx.drawImage(emptySign, contX, contY + 20);
		}
	});
}

function drawOpponents() {
	var i;
	if(opponents.length == 1)
	{
		drawFrontOpponent(opponents[0].name, opponents[0].state, opponents[0].numberOfCards);
	} 
	else if (opponents.length == 2)
	{
		for(i = 0; i < 2; ++i)
		{
			if(opponents[i].opponent == 'before')
				drawBeforeOpponent(opponents[i].name, opponents[i].state, opponents[i].numberOfCards);
			else drawAfterOpponent(opponents[i].name, opponents[i].state, opponents[i].numberOfCards);
		}
	}
	else 
	{
		for(i = 0; i < 3; ++i)
		{
			if(opponents[i].opponent == 'before')
				drawBeforeOpponent(opponents[i].name, opponents[i].state, opponents[i].numberOfCards);
			else if(opponents[i].opponent == 'after')
				drawAfterOpponent(opponents[i].name, opponents[i].state, opponents[i].numberOfCards);
			else drawFrontOpponent(opponents[i].name, opponents[i].state, opponents[i].numberOfCards);	
			
		}
	}
	
}

function drawFrontOpponent(name, state, n)  {
	backCard.addEventListener("load", function() {
		var contW = canvasW / 5;
		var contH = 160;
		var contX = canvasW / 2 - contW/2 - 20; // 320
		var contY =  10;
		
		var distance = contW/n;

		ctx.font = "20px Arial";
		ctx.fillText(name + ": " + state , contX, contY + contH + 20);
		
		for(var i = 0; i < n; ++i)
		{
			ctx.drawImage(backCard, contX + i*distance, contY,110,160)
		}
	});
}

function drawBeforeOpponent(name, state, n) {
	backCard.addEventListener("load", function() {
		var contW = canvasW / 5;
		var contH = 160;
		var contX = canvasW / 2 + contW - 20; // 320
		var contY =  10;
		
		var distance = contW/n;

		ctx.font = "20px Arial";
		ctx.fillText(name + ": " + state , contX, contY + contH + 20);
		for(var i = 0; i < n; ++i)
		{
			ctx.drawImage(backCard, contX + i*distance, contY,110,160)
		}
	});
}

function drawAfterOpponent(name, state, n) {
	backCard.addEventListener("load", function() {
		var contW = canvasW / 5;
		var contH = 160;
		var contX = canvasW / 2 - 2*contW - 20; // 320
		var contY =  10;
		var distance = contW/n;

		ctx.font = "20px Arial";
		ctx.fillText(name + ": " + state , contX, contY + contH + 20);
		
		for(var i = 0; i < n; ++i)
		{
			ctx.drawImage(backCard, contX + i*distance, contY,110, 160)
		}
	});
}

$(doThisWhenLoaded);