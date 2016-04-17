var express = require("express");
var app = express();

var http = require("http");
var server = http.Server(app);
var socketio = require("socket.io");
var player = require("./player.js");
var deck = require("./deck.js");
var room = require("./room.js");
var io = socketio(server);

app.use(express.static("pub"));

var players = [];

io.on("connect", function(socket) {

});

server.listen(8037, function() {
	console.log("Server is listening on port 8037");
});
