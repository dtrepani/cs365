var express = require("express");
var app = express();
var http = require("http");
var server = http.Server(app);
var socketio = require("socket.io");
var io = socketio(server);

var player = require("./player.js");
var room = require("./room.js");

app.use(express.static("pub"));

var rooms = [];
var allPlayers = [];
var playersNotInRoom = [];
var playersInRoom = []; // Cache variable. Do not set directly.


//TODO: if during the game one player disconnects,
//returns to a roomscreen with message ("player dissconected");


io.on("connection", function(socket) {
	console.log("Somebody connected :)");

	socket.on("disconnect", function() {
		var userIndex = getIndexOfPlayer(socket, allPlayers);
		if (userIndex !== -1) {
			var user = allPlayers.splice(userIndex, 1)[0];
			console.log(user.getName() + " disconnected :(");
		} else {
			console.log("Disconnected :(");
		}

		if (checkIfPlayerIsInRoom(socket)) {
			removePlayerFromAnyRoomsTheyreIn(socket);
			updateRooms();
		} else {
			// Do not need to update rooms if player was not in a room.
			playersNotInRoom.splice(getIndexOfPlayer(socket, playersNotInRoom), 1)[0];
		}
	});

	socket.on("login", function(username) {
		if(playersNotInRoom.length > 0 && checkIfNameExists(username))
			socket.emit("nameExists", username);
		else  {
			console.log(username + " is added");

			var user = new player.Player(username, socket);
			allPlayers.push(user);
			playersNotInRoom.push(user);

			socket.emit("showRooms", username);
		}

		updateRooms();
	});

	socket.on("join", function(roomNumber) {
		if(!rooms[roomNumber].isFull()) {
			if(!checkIfPlayerIsInRoom(socket)) {
				addPlayerToRoom(roomNumber, socket);
			} else {
				socket.emit("sendMessage", "Exit your current room first.");
			}
		} else {
			socket.emit("sendMessage", "This room is full. Please, choose another room.");
		}
	});

	socket.on("changeState", function(playerState) {
		var roomNumber = getRoomIndexOfPlayer(socket);
		var user = allPlayers[getIndexOfPlayer(socket, allPlayers)];
		user.setState(playerState);
		console.log("user: " + user.getName() + " - state: " + user.getState());

		if (rooms[roomNumber].readyToStart()) {
			console.log("Ready to start in room " + roomNumber);

			rooms[roomNumber].startGame();

			io.in(rooms[roomNumber].getName())
				.emit("startGame", rooms[roomNumber].getPlayers());
			io.emit("lockRoom", roomNumber);
			sendDataToRoom(roomNumber);
		}
	});

	socket.on("exitRoom", function(roomNumber) {
		removePlayerFromRoom(roomNumber, socket);
		updateRooms();
	});

	socket.on("discard", discard);
	socket.on("playCard", playCard);
	socket.on("takeCards", takeCards);

	function discard(roomNumber) {
		rooms[roomNumber].discard(socket);
		sendDataToRoom(roomNumber);
	}

	/**
	* @param {int} roomNumber
	* @see Room->playCard().
	*/
	function playCard(roomNumber, cardIndex, slotIndex) {
		rooms[roomNumber].playCard(socket, cardIndex, slotIndex);
		sendDataToRoom(roomNumber);
	}

	function takeCards(roomNumber) {
		rooms[roomNumber].playerTakeCards(socket);
		sendDataToRoom(roomNumber);
	}
});

/**
* If the player doesn't exist in playersNotInRoom[], they're in a room.
*/
function checkIfPlayerIsInRoom(socket) {
	return (getIndexOfPlayer(socket, playersNotInRoom) === -1);
}

function checkIfNameExists(name) {
	for(var i = 0; i < allPlayers.length; ++i) {
		if(name === allPlayers[i].getName()) {
			return true;
		}
	}
	return false;
}

function removePlayerFromRoom(roomNumber, socket) {
	var user = rooms[roomNumber].removePlayer(socket);
	if (user !== false) {
		playersNotInRoom.push(user);
		socket.leave(rooms[roomNumber].getName());
		return true;
	}
	return false;
}

function addPlayerToRoom(roomNumber, socket) {
	var user = playersNotInRoom.splice(getIndexOfPlayer(socket, playersNotInRoom), 1)[0];
	rooms[roomNumber].addPlayer(user);

	socket.room = rooms[roomNumber].getName();
	socket.join(rooms[roomNumber].getName());
	socket.emit("joinedSuccessfully", roomNumber);

	io.in(rooms[roomNumber].getName())
		.emit("updatePlayerListInRoom", rooms[roomNumber].getPlayers());
	updateRooms();
}

//////////////// Newly added methods

function getDataFor(roomNumber, socket) {
	return rooms[roomNumber].getDataForPlayer(socket);
}

/**
* @param  {Object}		socket	Socket of player.
* @param  {Object[]}	array	Array to use to check for index of player.
*
* @return {int} Index of player with socket or -1 if not found.
*/
function getIndexOfPlayer(socket, array) {
	for (var i = 0; i < array.length; i++) {
		if (array[i].isSocket(socket)) {
			return i;
		}
	}
	return -1;
}

function getRoomIndexOfPlayer(socket) {
	for (var i = 0; i < rooms.length; i++) {
		if (rooms[i].playerIsInRoom(socket)) {
			return i;
		}
	}
	return -1;
}

function initRooms() {
	rooms = [];
	for (var i = 0; i < 6; i++) {
		rooms.push(new room.Room('room' + i));
	}
}

/**
* When it's not clear what room the player is in, check all rooms.
*/
function removePlayerFromAnyRoomsTheyreIn(socket) {
	for (var i = 0; i < rooms.length; i++) {
		if (removePlayerFromRoom(i, socket)) {
			break;
		}
	}
}

function sendDataToRoom(roomNumber) {
	var playerSockets = rooms[roomNumber].getPlayerSockets();
	for (var i = 0; i < playerSockets.length; i++) {
		var data = getDataFor(roomNumber, playerSockets[i]);
		playerSockets[i].emit("sendData", data);
	}
}

function updateRooms() {
	var playersInRooms = [];
	for (var i = 0; i < rooms.length; i++) {
		playersInRooms.push(rooms[i].getPlayers());
	}
	io.emit("updateRooms", playersInRooms);
}

server.listen(8028, function() {
	initRooms();
	console.log("Server is listening on port 8028");
});