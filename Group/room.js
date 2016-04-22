"use strict"

var player = require("./player.js");
var deck = require("./deck.js");
var card = require("./card.js");

module.exports = {
	Room: Room
};

function Room(name) {
	this.name = name;
	this.players = [];
	this.deck;
	this.discardDeck;
	this.state = "waiting";
	this.currentTurn = "attacking"; // See playerStateCycle
	this.cardsInPlay = {
		attacking: [],
		defending: []
	};
	this.attackerDiscard = {
		attacking: false,
		supporting: false
	}

	/**
	* @var {Player Object[]}	Players get removed from the game as
	* they empty their hand once the deck is depleted, but they're still
	* in the room itself.
	*/
	this.playersInGame = [];

	/**
	* @var {string[]}	Use (this.playersInGame.length - 2) to
	* 	get appropriate state cycle to use for the number
	*	of players in game. Corresponds to players[] and
	*	their position.
	*/
	this.playerStateCycle = [
		["attacking", "defending"],
		["attacking", "defending", "supporting"],
		["attacking", "defending", "waiting", "supporting"]
	];
}

Room.prototype = {
	// Room setup
	addPlayer: addPlayer,
	readyToStart: readyToStart,
	getName: getName,
	getPlayerWithSocket: getPlayerWithSocket,
	getPlayers: getPlayers,
	getPlayerObjects: getPlayerObjects,
	getPlayerSockets: getPlayerSockets,
	getState: getState,
	isFull: isFull,
	playerIsInRoom: playerIsInRoom,
	removePlayer: removePlayer,
	setState: setState,

	// Game setup
	determineAttackOrder: determineAttackOrder,
	initializeAttackCycle: initializeAttackCycle,
	startGame: startGame,
	sortByLowestTrump: sortByLowestTrump,

	// Game data
	getDataForPlayer: getDataForPlayer,
	getDataForOpponents: getDataForOpponents,
	getPlayerInGameIndexForState: getPlayerInGameIndexForState,

	// Game actions
	allAttackCardsHaveBeenPlayed: allAttackCardsHaveBeenPlayed,
	allAttacksHaveBeenDefended: allAttacksHaveBeenDefended,
	checkIfPlayerCanBeRemovedFromGame: checkIfPlayerCanBeRemovedFromGame,
	dealCards: dealCards,
	discard: discard,
	makeMove: makeMove,
	nextRound: nextRound,
	nextTurn: nextTurn,
	noMoreCardsCanBePlayed: noMoreCardsCanBePlayed,
	playCard: playCard,
	playerTakeCards: playerTakeCards,
	takeCardsInPlay: takeCardsInPlay
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

function allAttackCardsHaveBeenPlayed() {
	var user = this.players[this.getPlayerInGameIndexForState("attacking")];
	return !user.hasCardsThatMatchNumbers(this.cardsInPlay.attacking) && !user.hasCardsThatMatchNumbers(this.cardsInPlay.defending);
}

function allAttacksHaveBeenDefended() {
	for (var i = 0; i < this.cardsInPlay.defending.length; i++) {
		if (!this.cardsInPlay.defending[i]) {
			return false;
		}
	}
	return true;
}

function checkIfPlayerCanBeRemovedFromGame(user) {
	if (this.deck.numberOfCards() === 0 && user.numberOfCards() === 0) {
		user.setState("waiting");
		this.playersInGame.splice(this.playersInGame.indexOf(user), 1);
		return true;
	}
	return false;
}

function dealCards() {
	var attackerIndex = this.getPlayerInGameIndexForState("attacking");

	for (var i = 0; i < this.playersInGame.length; i++) {
		var modIndex = (attackerIndex + i) % (this.playersInGame.length);
		while (
			(this.playersInGame[modIndex].numberOfCards() &&
				(6 - this.playersInGame[modIndex].numberOfCards() > 0) &&
				((this.deck.numberOfCards() > 0)) ||
			(this.deck.numberOfCards() === 0 && this.deck.getTrump()))
		) {
			if (this.deck.numberOfCards() === 0) {
				this.playersInGame[modIndex].giveCard(this.deck.takeTrump());
			} else {
				this.playersInGame[modIndex].giveCard(this.deck.removeCard());
			}
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
	var trumpSuit = this.deck.getTrump().getSuit();

	for (var i = 0; i < this.playersInGame.length; i++) {
		while (6 - this.playersInGame[i].numberOfCards() > 0) {
			this.playersInGame[i].giveCard(this.deck.removeCard());
		}
	}

	for (var i = 0; i < this.playersInGame.length; i++) {
		playersWithTrump.push({
			player: this.playersInGame[i],
			trump: this.playersInGame[i].getLowestTrump(trumpSuit)
		});
	}

	playersWithTrump.sort(this.sortByLowestTrump);

	for (var i = 0; i < this.playersInGame.length; i++) {
		this.playersInGame[i] = playersWithTrump[i].player;
	}

	this.initializeAttackCycle();
}

function discard(socket) {
	var user = this.getPlayerWithSocket(socket);
	if (user) {
		var userState = user.getState();
		if (userState === "attacking") {
			this.attackerDiscard.attacking = true;
		} else if (userState === "supporting") {
			this.attackerDiscard.supporting = true;
		}

		if (this.attackerDiscard.attacking && (this.playersInGame.length === 2 || this.attackerDiscard.supporting) && this.cardsInPlay.attacking.length > 0) {
			this.discardDeck.addCards(this.takeCardsInPlay());
			console.log("Discarding");
			this.nextRound(true);
		}
	}
}

/**
* Get data to send to the player about the game.
*
* @return {mixed[]} Data in the form of {cards, state, trump, numberOfCardsInDeck, cardsInPlay{attacking, defending}, opponentData = {opponent, name, numberOfCards}}.
*/
function getDataForPlayer(socket) {
	var data = {};
	var playerIndex = 0;

	data.cardsInPlay = this.cardsInPlay;
	data.trump = this.deck.getTrump();
	data.numberOfCardsInDeck = this.deck.numberOfCards();

	for (var i = 0; i < this.players.length; i++) {
		var user = this.players[i];
		if (user.isSocket(socket)) {
			data.myUsername = user.getName();
			data.cards = user.getCards();
			data.state = user.getState();
			data.isTurn = (user.getState() === this.currentTurn);
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
		{type: "before", index: (playerIndex + this.players.length - 1) % this.players.length},
		{type: "after", index: (playerIndex + 1) % this.players.length},
		{type: "waiting", index: (playerIndex + 2) % this.players.length},
	];
	for (var i = 0; i < this.players.length - 1; i++) {
		var user = this.players[opponentIndex[i].index];
		data.opponentData.push({
			opponent: opponentIndex[i].type,
			name: user.getName(),
			state: user.getState(),
			numberOfCards: user.numberOfCards()
		});
	}
	return data;
}

function getName() {
	return this.name;
}

function getPlayerInGameIndexForState(state) {
	for (var i = 0; i < this.playersInGame.length; i++) {
		if (this.playersInGame[i].getState() === state) {
			return i;
		}
	}
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

function getPlayerObjects() {
	return this.players;
}

function getPlayerSockets() {
	var sockets = [];
	for (var i = 0; i < this.players.length; i++) {
		sockets.push(this.players[i].getSocket());
	}
	return sockets;
}

function getPlayerWithSocket(socket) {
	for (var i = 0; i < this.players.length; i++) {
		if (this.players[i].isSocket(socket)) {
			return this.players[i];
		}
	}
	return false;
}

function getState() {
	return this.state;
}

function initializeAttackCycle() {
	var cycle = this.playerStateCycle[this.playersInGame.length - 2];
	for (var i = 0; i < this.playersInGame.length; i++) {
		this.playersInGame[i].setState(cycle[i]);
	}
}

function isFull() {
	return (this.players.length > 3);
}

function makeMove(user, cardIndex, slotIndex) {
	if (user) {
		var userState = user.getState();
		if (userState === this.currentTurn || (this.currentTurn === "defending" && userState === "supporting")) {
			if (userState === "defending") {
				this.cardsInPlay.defending[slotIndex] = user.playCard(cardIndex);
			} else if (userState === "attacking" || userState === "supporting") {
				this.cardsInPlay.attacking.push(user.playCard(cardIndex));
				this.cardsInPlay.defending.push(undefined);
			}

			return true;
		}
		return false;
	}
}

/**
* Called on round end. Cycles player states for the
* next round and deals the cards for that round.
*
* @param {bool} dealCardsOnRound	Will only ever not need to deal cards when
*									defender takes cards, which will call nextRound()
*									twice, but only need to deal cards once.
*/
function nextRound(dealCardsOnRound) {
	for (var i = 0; i < this.playersInGame.length; i++) {
		this.checkIfPlayerCanBeRemovedFromGame(this.playersInGame[i]);
	}

	if (this.playersInGame.length > 1) {
		console.log("Next round");

		if (dealCardsOnRound) {
			this.dealCards();
		}

		var cycle = this.playerStateCycle[this.playersInGame.length - 2];
		this.currentTurn = "attacking";

		for (var i = 0; i < this.playersInGame.length; i++) {
			var user = this.playersInGame[i];
			var stateIndex = cycle.indexOf(user.getState());
			user.setState(cycle[(stateIndex + 1) % cycle.length]);
		}
	}
}

/**
* Cycle to the next player's turn.
*
* Player states are cycled if current turn is at the end
* of an play cycle or no more cards can be played.
*/
function nextTurn() {
	if (this.currentTurn === "defending" && this.noMoreCardsCanBePlayed()) {
		console.log("No more cards can be played.");
		this.nextRound(true);
	}

	this.currentTurn = (this.currentTurn === "defending") ? "attacking" : "defending";

	console.log("Turn: " + this.currentTurn);
}

/**
* If the defender just played, but no more attack
* cards can be played, end the round and cycle
* the states.
*/
function noMoreCardsCanBePlayed() {
	return (
		(this.currentTurn === "defending") &&
		(this.playersInGame[this.getPlayerInGameIndexForState("defending")].numberOfCards() === 0)
	);
}

/**
* @param {Socket Object} socket
* @param {int} cardIndex Index of card that player is playing.
* @param {int} slotIndex Index of slot that card is being placed on.
*/
function playCard(socket, cardIndex, slotIndex) {
	var user = this.getPlayerWithSocket(socket);
	if (this.makeMove(user, cardIndex, slotIndex)) {
		var state = user.getState();
		if (state === "attacking" && this.allAttackCardsHaveBeenPlayed()) {
			this.nextTurn();
		} else if (state === "defending" && this.allAttacksHaveBeenDefended()) {
			this.nextTurn();
		}
	}
}

function playerIsInRoom(socket) {
	for (var i = 0; i < this.players.length; i++) {
		if (this.players[i].isSocket(socket)) {
			return true;
		}
	}
	return false;
}

function playerTakeCards(socket) {
	var user = this.getPlayerWithSocket(socket);
	if (user) {
		var userState = user.getState();
		if (this.currentTurn === "defending" && userState === "defending" && this.cardsInPlay.attacking.length > 0) {
			user.takeCards(this.takeCardsInPlay());
			console.log("Taking cards");
			this.nextRound(true);
			if (this.playersInGame.length === 2) {
				this.nextRound(false);
			}
		}
	}
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
	this.currentTurn = "attacking";
	this.playersInGame = this.players;
	this.cardsInPlay.attacking = [];
	this.cardsInPlay.defending = [];
	this.attackerDiscard.attacking = false;
	this.attackerDiscard.supporting = false;

	this.determineAttackOrder();
}

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

function takeCardsInPlay() {
	var cards = [];
	for (var i = 0; i < this.cardsInPlay.attacking.length; i++) {
		while (this.cardsInPlay.attacking.length !== 0) {
			cards.push(this.cardsInPlay.attacking.pop());
		}
	}
	for (var i = 0; i < this.cardsInPlay.defending.length; i++) {
		while (this.cardsInPlay.defending.length !== 0) {
			var defenderCard = this.cardsInPlay.defending.pop();
			if (defenderCard) {
				cards.push(defenderCard);
			}
		}
	}
	return cards;
}
