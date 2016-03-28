var express = require("express");
var app = express();

var http = require("http");
var server = http.Server(app);
var socketio = require("socket.io");
var io = socketio(server);

app.use(express.static("pub"));

var gameWon = false;
var players = {};
var spectators = [];
var pieces = new Array([]);

io.on("connection", function(socket) {
	assignToColor(socket);

	if (isNotSpectator(socket)) {

	}

	socket.on("getPieces", sendPiecesToClient.bind(null, socket));
	socket.on("disconnect", disconnect.bind(null, socket));
});

server.listen(8037, function() {
	console.log("Server is listening on port 8037");
});

/** Only the players are kept tracked of. Any additional players are ignored. */
function assignToColor(socket) {
	setPlayerTo(null, socket);

	if (gameWon) {
		// socket.emit((relativePos < 0) ? "redWon" : "blackWon");
	}
}

function disconnect(socket) {
	setPlayerTo(socket, null);
}

/** Only players can play the game. */
function isNotSpectator(socket) {
	return (players['red'] === socket || players['black'] === socket);
}

function reset() {
	if (gameWon) {
		console.log("Resetting game.");
		gameWon = false;
		io.emit("resetClient");
	}
}

function sendPiecesToClient(socket) {
	socket.emit("updatePieces", pieces);
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
	if (players['red'] == comparison) {
		players['red'] = (!newPlayer && spectators[0]) ? spectators.pop() : newPlayer;
 		return true;
	}

	if (players['black'] == comparison) {
		players['black'] = (!newPlayer && spectators[0]) ? spectators.pop() : newPlayer;
		return true;
	}

	if (!newPlayer) {
		spectators.push(newPlayer);
	}
	return false;
}
