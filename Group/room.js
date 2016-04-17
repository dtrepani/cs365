"use strict"

var player = require("./player.js");
var deck = require("./deck.js");
var card = require("./card.js");

module.exports = {
	Room: Room
};

// TODO:
// 	Setup actually playing the game

function Room(name) {
	this.name = name;
	this.players = [];
	this.deck;
	this.discardDeck;
	this.state = "waiting";
	this.cardsInPlay = []; // Max 6x2 array for the cards in play.

	/**
	* @var {string[]}	Use (this.players.length - 2) to get appropriate state
	*					cycle to use for the number of players in game.
	*/
	this.stateCycle = [
		["attacking", "defending"],
		["attacking", "defending", "supporting"],
		["attacking", "defending", "waiting", "supporting"]
	];
}

Room.prototype = {
	addPlayer: addPlayer,
	cyclePlayerStates: cyclePlayerStates,
	dealCards: dealCards,
	determineAttackOrder: determineAttackOrder,
	readyToStart: readyToStart,
	getDataForPlayer: getDataForPlayer,
	getDataForOpponents: getDataForOpponents,
	getName: getName,
	getPlayers: getPlayers,
	getPlayerSockets: getPlayerSockets,
	getState: getState,
	initializeAttackCycle: initializeAttackCycle,
	isFull: isFull,
	playerIsInRoom: playerIsInRoom,
	removePlayer: removePlayer,
	setState: setState,
	startGame: startGame
};



/**
* @param  {Player Object}	player	Note that this is not a socket, but the
*									player itself.
*
* @return {bool} 					Player added successfully or room is full.
*/
function addPlayer(player) {
	if (this.players.length < 4) {
		this.players.push(player);
		return true;
	}
	return false;
}

function cyclePlayerStates() {
	var cycle = this.stateCycle[this.players.length - 2];
	for (var i = 0; i < this.players.length; i++) {
		this.players[i].setState(cycle[(i + 1) % cycle.length]);
	}
}

function dealCards() {
	for (var i = 0; i < this.players.length; i++) {
		var cardsNeeded = 6 - this.players[i].numberOfCards();
		for (var j = 0; j < cardsNeeded; j++) {
			this.players[i].giveCard(this.deck.removeCard());
		}
	}
}

/**
* Get attack order of players based on their lowest trump card.
* This will reorganize the players in the room to reflect the
* attack order.
*/
function determineAttackOrder() {
	var playersWithTrump = [];

	for (var i = 0; i < this.players.length; i++) {
		playersWithTrump.push({
			player: this.players[i],
			trump: this.players[i].getLowestTrump(this.deck.getTrump().getSuit())
		});
	}

	playersWithTrump.sort(sortByLowestTrump);

	for (var i = 0; i < this.players.length; i++) {
		this.players[i] = playersWithTrump[i].player;
	}

	this.initializeAttackCycle();

	function sortByLowestTrump(player1, player2) {
		player1 = player1.trump;
		player2 = player2.trump;

		if (!player1 && !player2) {
			return 0;
		} else if (!player2 || (player1 && player1.getNumber() < player2.getNumber())) {
			return -1;
		} else if (!player1 || (player2 && player1.getNumber() > player2.getNumber())) {
			return 1;
		} else {
			return 0;
		}
	}
}

/**
* Get data to send to the player about the game.
*
* @return {mixed[]} Data in the form of {cards, state, cardsInPlay[][], opponentData = {opponent, name, numberOfCards}}.
*/
function getDataForPlayer(socket) {
	var data = {};
	var playerIndex = 0;

	for (var i = 0; i < this.players.length; i++) {
		var user = this.players[i];
		if (user.isSocket(socket)) {
			data.cards = user.getCards();
			data.state = user.getState();
			playerIndex = i;
		}
	}

	data = this.getDataForOpponents(data, playerIndex);
	return data;
}

/**
* All players regardless of game size will have a "before" opponent. Players in
* a game size of 3 will have an "after" opponent, too. Players in the max game size
* will have the forementioned and a "waiting" opponent.
*
* The use of (players - 1) is because we do not count the player that we're gathering
* opponent data for.
*
* @return {mixed[]}
* @see getDataForPlayer().
*/
function getDataForOpponents(data, playerIndex) {
	data.opponentData = [];
	var opponentIndex = [
		{type: "before", index: Math.abs((playerIndex - 1) % this.players.length)},
		{type: "after", index: (playerIndex + 1) % this.players.length},
		{type: "waiting", index: (playerIndex + 2) % this.players.length},
	];
	for (var i = 0; i < this.players.length - 1; i++) {
		var user = this.players[opponentIndex[i].index];
		data.opponentData.push({
			opponent: opponentIndex[i].type,
			name: user.getName(),
			numberOfCards: user.numberOfCards()
		});
	}
	return data;
}

function getName() {
	return this.name;
}

/**
* @return {string[]} The usernames of all players in the room.
*/
function getPlayers() {
	var namesOfPlayers = [];
	for (var i = 0; i < this.players.length; i++) {
		namesOfPlayers.push(this.players[i].getName());
	}
	return namesOfPlayers;
}

function getPlayerSockets() {
	var sockets = [];
	for (var i = 0; i < this.players.length; i++) {
		sockets.push(this.players[i].getSocket());
	}
	return sockets;
}

function getState() {
	return this.state;
}

function initializeAttackCycle() {
	var cycle = this.stateCycle[this.players.length - 2];
	for (var i = 0; i < this.players.length; i++) {
		this.players[i].setState(cycle[i]);
	}
}

function isFull() {
	return (this.players.length > 3);
}

function playerIsInRoom(socket) {
	for (var i = 0; i < this.players.length; i++) {
		if (this.players[i].isSocket(socket)) {
			return true;
		}
	}
	return false;
}

/**
* There must be at least two players in a room and all players must be
* ready in order to start a game.
*/
function readyToStart() {
	if (this.players.length < 2) {
		return false;
	}

	for (var i = 0; i < this.players.length; i++) {
		if (this.players[i].getState() !== 'ready') {
			return false;
		}
	}
	return true;
}

/**
* Cycle through each player in the room and remove the player
* that matches the given socket, if they exist.
*
* @return {Player Object|bool}	The player or false if player not in room.
*/
function removePlayer(socket) {
	for (var i = 0; i < this.players.length; i++) {
		if (this.players[i].isSocket(socket)) {
			return this.players.splice(i, 1)[0];
		}
	}

	if (this.players.length < 2) {
		this.state = "waiting";
	}

	return false;
}

/**
* @param {string} aState States are waiting and playing.
*/
function setState(aState) {
	this.state = aState;
}

function startGame() {
	this.deck = new deck.Deck(36);
	this.discardDeck = new deck.Deck(0);
	this.state = "playing";

	this.dealCards();
	this.determineAttackOrder();

	// TODO:
	//	PLAY GAME! :))
}
