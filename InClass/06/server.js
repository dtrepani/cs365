var express = require("express");
var app = express();

var http = require("http");
var server = http.Server(app);
var socketio = require("socket.io");
var player = require("./player.js");
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
			var result;
			var row = data.row;
			var col = data.col;

			if (redTurn) {
				result = players.red.makeMove(socket, pieces, row, col);
				redTurn = !result.success;
				pieces = result.pieces;
			} else {
				result = players.black.makeMove(socket, pieces, row, col);
				redTurn = result.success;
				pieces = result.pieces;
			}

			sendDataToClients();
			checkForWin();
		});

		 // Update if other player connected.
		sendDataToClients();
	}

	socket.on('getData', sendDataToClient.bind(null, socket));
	socket.on('disconnect', disconnect.bind(null, socket));
	socket.on('reset', reset);

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
	players.red = new player.Player(null, 'red');
	players.black = new player.Player(null, 'black');
});

/** Only the players are kept tracked of. Any additional players are ignored. */
function assignToColor(socket) {
	setPlayerTo(null, socket);
	checkForWin();
}

function checkForWin() {
	if (players.red.getScore() === 10) {
		gameWon = true;
		io.emit('redWon');
	} else if (players.black.getScore() === 10) {
		gameWon = true;
		io.emit('blackWon');
	}
}

function getData() {
	return {
		status: getStatus(),
		pieces: pieces,
		scores: {
			red: players.red.getScore(),
			black: players.black.getScore()
		}
	};
}

function getRole(socket) {
	return players.red.isSocket(socket)
			? 'red'
				: players.black.isSocket(socket)
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
	pieces = new Array(boardSize);
	for (var i = 0; i < boardSize; i++) {
		pieces[i] = new Array(boardSize);
	}
}

/** Only players can play the game. */
function isNotSpectator(socket) {
	return (players.red.isSocket(socket) ||
		players.black.isSocket(socket));
}

function reset() {
	if (gameWon) {
		console.log("Resetting game.");
		initBoard();
		players.red.setScore(0);
		players.black.setScore(0);
		sendDataToClients();
		io.emit('resetClient');
		gameWon = false;
	}
}

function sendDataToClients() {
	io.emit('updateData', getData());
}

function setPlayer(color, comparison, newPlayer) {
	if (players[color].isSocket(comparison)) {
		if (!newPlayer && spectators[0]) {
			players[color].setSocket(spectators.pop())
		} else {
			players[color].setSocket(newPlayer);
		}
 		return true;
	}
	return false;
}

function setPlayerTo(comparison, newPlayer) {
	if (setPlayer('red', comparison, newPlayer)) {
		return true;
	}

	if (setPlayer('black', comparison, newPlayer)) {
		return true;
	}

	if (!newPlayer) {
		spectators.push(newPlayer);
	}
	return false;
}

function waitingForPlayer() {
	return (players.red.isSocket(null) || players.black.isSocket(null));
}
