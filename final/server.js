var express = require("express");
var app = express();

var http = require("http");
var server = http.Server(app);
var socketio = require("socket.io");
var player = require("./player.js");
var io = socketio(server);

app.use(express.static("pub"));

var boardSize = 3;
var gameWon = false;
var pieces = new Array(boardSize);
var players = {};
var spectators = [];
var mTurn = true;

io.on("connect", function(socket) {
	assignToLetter(socket);
	socket.emit('setRole', getRole(socket));

	if (isNotSpectator(socket)) {
		socket.on('playLetter', function(data) {
			var result;
			var row = data.row;
			var col = data.col;

			if (mTurn) {
				result = players.m.playLetter(socket, pieces, row, col);
				mTurn = !result.success;
				pieces = result.pieces;
			} else {
				result = players.o.playLetter(socket, pieces, row, col);
				mTurn = result.success;
				pieces = result.pieces;
			}

			sendDataToClients();
			checkForWin(result.winMade);
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
	players.m = new player.Player(null, 'm');
	players.o = new player.Player(null, 'o');
});

/** Only the players are kept tracked of. Any additional players are ignored. */
function assignToLetter(socket) {
	setPlayerTo(null, socket);
	checkForWin(null);
}

function checkForWin(winMade) {
	if (winMade) {
		if (!mTurn) {
			gameWon = true;
			io.emit('mWon');
		} else {
			gameWon = true;
			io.emit('oWon');
		}
	} else if (gameWon && winMade === null) {
		io.emit(!mTurn ? 'mWon' : 'oWon');
	}
}

function getData() {
	return {
		status: getStatus(),
		pieces: pieces,
		scores: {
			m: players.m.getScore(),
			o: players.o.getScore()
		}
	};
}

function getRole(socket) {
	return players.m.isSocket(socket)
			? 'm'
				: players.o.isSocket(socket)
					? 'o'
					: 'spectator';
}

function getStatus() {
	return waitingForPlayer()
			? 'Waiting for other player.'
			: mTurn
				? "M's turn."
				: "O's turn.";
}

// Initialize board to empty 3 x 3 array.
function initBoard() {
	pieces = new Array(boardSize);
	for (var i = 0; i < boardSize; i++) {
		pieces[i] = new Array(boardSize);
	}
}

/** Only players can play the game. */
function isNotSpectator(socket) {
	return (players.m.isSocket(socket) ||
		players.o.isSocket(socket));
}

function reset() {
	console.log("Resetting game.");
	initBoard();
	sendDataToClients();
	io.emit('resetClient');
	gameWon = false;
}

function sendDataToClients() {
	io.emit('updateData', getData());
}

function setPlayer(letter, comparison, newPlayer) {
	if (players[letter].isSocket(comparison)) {
		players[letter].setSocket(newPlayer);
 		return true;
	}

	return false;
}

function setPlayerTo(comparison, newPlayer) {
	if (setPlayer('m', comparison, newPlayer)) {
		return true;
	}

	if (setPlayer('o', comparison, newPlayer)) {
		return true;
	}

	if (comparison === null) {
		spectators.push(newPlayer);
	}

	return false;
}

function waitingForPlayer() {
	return (players.m.isSocket(null) || players.o.isSocket(null));
}
