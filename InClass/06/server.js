var express = require("express");
var app = express();

var http = require("http");
var server = http.Server(app);
var socketio = require("socket.io");
var io = socketio(server);

app.use(express.static("pub"));

var boardSize = 13;
var gameWon = false;
var pieces = new Array(boardSize);
var players = {};
var spectators = [];
var redTurn = true;

io.on("connect", function(socket) {
	assignToColor(socket);
	socket.emit('setRole', getRole(socket));

	if (isNotSpectator(socket)) {
		socket.on('makeMove', function(data) {
			var row = data.row;
			var col = data.col;

			if (!pieces[row][col]) {
				if (isRedPlayer(socket) && redTurn) {
					pieces[row][col] = 'red';
					redTurn = false;
				} else if (isBlackPlayer(socket) && !redTurn) {
					pieces[row][col] = 'black';
					redTurn = true;
				}

				sendDataToClients();
			}
		});

		 // Update if other player connected.
		sendDataToClients();
	}

	socket.on('getData', sendDataToClient.bind(null, socket));
	socket.on('disconnect', disconnect.bind(null, socket));

	function disconnect(socket) {
		setPlayerTo(socket, null);
		sendDataToClients();
	}

	function sendDataToClient(socket) {
		socket.emit("updateData", getData());
	}
});

server.listen(8037, function() {
	console.log("Server is listening on port 8037");
	initBoard();
});

/** Only the players are kept tracked of. Any additional players are ignored. */
function assignToColor(socket) {
	setPlayerTo(null, socket);

	if (gameWon) {
		// socket.emit((relativePos < 0) ? "redWon" : "blackWon");
	}
}

function capturedPieces(socket, row, col) {
	if (captureWithinBounds(row) && captureWithinBounds(col)) {
		for (int i = -2; i < 2; i++) {
			for (int j = -2; j < 2; j++) {
				if (!(i === 0) || !(j === 0)) {

				}
			}
		}
	}

	return false;
}

function isOtherPlayersPiece(socket, row, col) {
	return (
		(isRedPlayer(socket) &&
			(pieces[row][col] === 'blue')) ||
		(isBluePlayer(socket)
			&& (pieces[row][col] === 'red'))
	);
}

/** When checking for a capture, the capture must be within the bounds of the board to be possible.*/
function captureWithinBounds(number) {
	return (number + 2 < boardSize && number - 2 >= 0);
}

function getData() {
	return {
		status: getStatus(),
		pieces: pieces
	};
}

function getRole(socket) {
	return isRedPlayer(socket)
			? 'red'
				: isBlackPlayer(socket)
					? 'black'
					: 'spectator';
}

function getStatus() {
	return waitingForPlayer()
			? 'Waiting for other player.'
			: redTurn
				? "Red's turn."
				: "Black's turn.";
}

// Initialize board to empty 13 x 13 array.
function initBoard() {
	for (var i = 0; i < boardSize; i++) {
		pieces[i] = new Array(boardSize);
	}
}

function isBlackPlayer(comparison) {
	return (players['black'] == comparison);
}

function isRedPlayer(comparison) {
	return (players['red'] == comparison);
}

/** Only players can play the game. */
function isNotSpectator(socket) {
	return (isRedPlayer(socket) || isBlackPlayer(socket));
}

function reset() {
	if (gameWon) {
		console.log("Resetting game.");
		gameWon = false;
		io.emit("resetClient");
	}
}

function sendDataToClients() {
	io.emit('updateData', getData());
}

/**
* Find and set the appropriate player, if it exists.
*
* @param	comparison	mixed	Find the player according to this parameter
* @param	newPlayer	mixed	Set the player to a new value
*
* @return	bool		Whether or not the player was found
*/
function setPlayerTo(comparison, newPlayer) {
	if (isRedPlayer(comparison)) {
		players['red'] = (!newPlayer && spectators[0]) ? spectators.pop() : newPlayer;
 		return true;
	}

	if (isBlackPlayer(comparison)) {
		players['black'] = (!newPlayer && spectators[0]) ? spectators.pop() : newPlayer;
		return true;
	}

	if (!newPlayer) {
		spectators.push(newPlayer);
	}
	return false;
}

function waitingForPlayer() {
	return !(players['red'] && players['black']);
}
