"use strict"

var player = require("./player.js");
var deck = require("./deck.js");

module.exports = {
	Room: Room
};

function Room() {
	this.players = [];
	this.deck = new deck.Deck(36);
	this.discardDeck = new deck.Deck(0);
	this.state = "waiting";
}

Room.prototype = {
	addPlayer: addPlayer,
	getState: getState,
	removePlayer: removePlayer,
	setState: setState
};

function addPlayer(socket) {
	if (this.players.length < 3) {
		this.players.push(new player.Player(socket));
	}
}

function getState() {
	return this.state;
}

/**
* @return {bool}	Whether or not the player exists in this
*					room and was removed.
*/
function removePlayer(socket) {
	for (var i = 0; i < this.players.length; i++) {
		if (this.players[i].isSocket(socket)) {
			this.players.splice(i, 1);
			return true;
		}
	}
	return false;
}

/**
* @param {string} aState States are waiting and playing
*/
function setState(aState) {
	this.state = aState;
}
