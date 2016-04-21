var express = require("express");
var app = express();

var mongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;

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
var db;

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
			console.log("Somebody disconnected :(");
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
	socket.on("take", takeCards); // Duplicate

	function discard(roomNumber) {
		rooms[roomNumber].discard(socket);
		sendDataToRoom(roomNumber);
		checkIfGameIsDone(roomNumber);
	}

	/**
	* @see Room->playCard().
	*/
	function playCard(data) {
		rooms[data.roomNumber].playCard(socket, data.cardIndex, data.slotIndex);
		sendDataToRoom(data.roomNumber);
	}

	function takeCards(roomNumber) {
		rooms[roomNumber].playerTakeCards(socket);
		sendDataToRoom(roomNumber);
	}
});

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

function checkIfGameIsDone(roomNumber) {
	if (rooms[roomNumber].checkIfGameIsDone()) {
		io.in(rooms[roomNumber].getName()).emit("gameDone");

		var users = rooms[roomNumber].getPlayerObjects();
		for (var i = 0; i < users.length; i++) {
			var user = {
				name: users[i].getName(),
				gameLost: (users[i].numberOfCards > 0) ? 1 : 0
			};
			updatePlayerScore(db, user);
		}
	}
}

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

function getDataFor(roomNumber, socket) {
	return rooms[roomNumber].getDataForPlayer(socket);
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
		// console.log(data);
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

// Database Methods

/**
* @param {string}	user.name,
* @param {int}		user.gameLost	0 if game was not lost by player, 1 if game was.
*/
function addPlayerScore(db, user, callback) {
	var collection = db.collection("users");
	collection.insertOne({
		name: user.name,
		gamesPlayed: 1,
		gamesLost: user.gameLost
	}, insertResult);

	function insertResult(err, result) {
		if (err != null) {
			console.log("Error on insert: " + err);
			callback(null);
		} else {
			callback(result);
		}
	}
}

/**
* @param {string}	user.name,
* @param {int}		user.gameLost	0 if game was not lost by player, 1 if game was.
*/
function updatePlayerScore(db, user, callback) {
	db.collection("users");
	collection.update(
		{name: user.name},
		{$inc: {gamesPlayed: 1, gamesLost: user.gameLost}},
		{ upsert: true },
		updateResult
	);

	function findResult(err, result) {
		if (err != null) {
			console.log("Error on update: " + err);
			callback(null);
		} else {
			callback(result);
		}
	}
}

function getTopPlayers(db, callback) {
	var collection = db.collection("users");
	collection.find({}).sort({ $divide: [ "$gamesPlayed", "$gamesLost" ]}).limit(10).toArray(findResult);
}

/**
* @param {string} username
*/
function getPlayerScore(db, name, callback) {
	var collection = db.collection("users");
	collection.findOne({name: name}).toArray(findResult);
}

function findResult(err, result) {
	if (err != null) {
		console.log("Error on find: " + err);
		callback(null);
	} else {
		callback(result);
	}
}

// mongoClient.connect("mongodb://localhost:8037/durak", function(err, database) {
// 	if (err) throw err;
// 	db = database;
// 	console.log("Connected to Mongo.");

	server.listen(8028, function() {
		initRooms();
		console.log("Server is listening on port 8028");

		// addPlayerScore(db, {name: "test", gameLost: 0}, function(result) {
		// 	console.log(result);
		// });

		// getTopPlayers(db, function(result) {
		// 	console.log(result);
		// });
	});
// });

