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
	this.attackCardsPlayedForRound = 0;
	this.cardsInPlay = []; // Max 6x2 array for the cards in play.

	/**
	* @var {string[]}	Use (this.players.length - 2) to
	* 	get appropriate state cycle to use for the number
	*	of players in game. Corresponds to players[] and
	*	their position.
	*/
	this.playerStateCycle = [
		["attacking", "defending"],
		["attacking", "defending", "supporting"],
		["attacking", "defending", "waiting", "supporting"]
	];

	/**
	* @var {string[]} Corresponds to turn order.
	* @see this.playerStateCycle
	*/
	this.turnCycle = [
		["attacking", "defending"],
		["attacking", "supporting", "defending"],
		["attacking", "supporting", "defending", "waiting"]
	];
}

Room.prototype = {
	// Room setup
	addPlayer: addPlayer,
	readyToStart: readyToStart,
	getName: getName,
	getPlayerWithSocket: getPlayerWithSocket,
	getPlayers: getPlayers,
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

	// Game data
	getDataForPlayer: getDataForPlayer,
	getDataForOpponents: getDataForOpponents,
	getPlayerIndexForState: getPlayerIndexForState,

	// Game actions
	cyclePlayerStates: cyclePlayerStates,
	dealCards: dealCards,
	discard: discard,
	isValidMove: isValidMove,
	nextTurn: nextTurn,
	playCard: playCard,
	playerTakeCards: playerTakeCards,
	takeCardsInPlay: takeCardsInPlay
};

// TODO: move methods to appropriate spot
function discard(socket) {
	var user = getPlayerWithSocket(socket);
	if (user.getState() === this.currentTurn) {
		this.discardDeck.addCards(this.takeCardsInPlay());
		this.nextTurn();
	}
}

function getPlayerIndexForState(state) {
	for (var i = 0; i < this.players.length; i++) {
		if (user.getState() === state) {
			return i;
		}
	}
}

function isValidMove(card, slotIndex) {
	var cardsInSlot = this.cardsInPlay[slotIndex];
	var topCardInSlot = getTopCardInSlot(slotIndex);

	switch (this.currentTurn) {
		case "supporting":
		case "attacking":
			return (cardsInSlot.length === 0 || cardValidSuitAndGreaterThanSlotCard());
		case "defending":
			return isValidMoveForDefender();
		case default:
			return false;
	}

	// Cards playing during one bout cannot exceed six OR the number of cards in defender's hands

	function getFirstEmptySlotIndex() {
		for (var i = 0; i < this.cardsInPlay.length; i++) {
			if (this.cardsInPlay[i].length === 0) {
				return i;
			}
		}
		return false;
	}

	function getTopCardInSlot(index) {
		var topCard = this.cardsInPlay[index].pop();
		this.cardsInPlay[index].push(topCard);
		return topCard;
	}

	function isValidMoveForAttacker() {
		// attacker can only start new pile if have card of same value as one of the piles topmost cards
		/**
		* get first empty slot that's not 0
		*	return if card is same value as topmost card of previous slot
		* if only have one empty slot and slot length is 0, return true
		*/
		var firstEmptySlotIndex = getFirstEmptySlotIndex();
		if (cardsInSlot.length === 0) {
			return true;
		else if (/* */) {
			// check that card matches the same value in a topmost card slot
		} else {
			return cardValidSuitAndGreaterThanSlotCard();
		}
	}

	function isValidMoveForDefender() {
		if (cardsInSlot.length === 0) {
			return false;
		}
		// if cardNumber === cardSlotNum, give to next player to defend?
		return cardValidSuitAndGreaterThanSlotCard();
	}

	function cardValidSuitAndGreaterThanSlotCard() {
		var isTrumpSuit = (card.getSuit() === this.deck.getTrump().getSuit());
		var isSameSuit = (card.getSuit() === cardsInSlot[topCardInSlot].getSuit());
		var beatsCardInSlot = card.getNumber() > cardsInSlot[topCardInSlot].getNumber();

		return ((isTrumpSuit && isSameSuit && beatsCardInSlot) ||
			(beatsCardInSlot && (isTrumpSuit || isSameSuit)));
	}
}

/**
* @param {Socket Object} socket
* @param {int} cardIndex Index of card that player is playing.
* @param {int} slotIndex Index of slot that card is being placed on.
*/
function playCard(socket, cardIndex, slotIndex) {
	var user = getPlayerWithSocket(socket);
	if (user.getState() === this.currentTurn &&
		this.isValidMove(user.getCard(cardIndex), slotIndex)
	) {
		var state = user.getState();
		this.cardsInPlay[slotIndex].push(user.playCard(cardIndex));
		if (state === "attacking" ||
			state === "supporting") {
			this.attackCardsPlayedForRound++;
			this.nextTurn();
		} else if (state === "defending") {
			// TODO: if has defended against all moves
			this.nextTurn();
		}
	}
}

function playerTakeCards(socket) {
	var user = getPlayerWithSocket(socket);
	if (user.getState() === this.currentTurn) {
		user.takeCards(this.takeCardsInPlay());

		// if player was defending, forfeit turn
		this.nextTurn();
	}
}
///////////////////////////



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

/**
* Called on round end. Cycles player states for the
* next round and deals the cards for that round.
*/
function cyclePlayerStates() {
	var cycle = this.playerStateCycle[this.players.length - 2];
	this.attackCardsPlayedForRound = 0;

	for (var i = 0; i < this.players.length; i++) {
		var user = this.players[i];
		var stateIndex = cycle.indexOf(user.getState());
		user.setState(cycle[(stateIndex + 1) % cycle.length]);
	}

	this.dealCards();
}

// TODO: Deals according to playerStateCycle, but should deal according to turnCycle
function dealCards() {
	var attackerIndex = this.getPlayerIndexForState("attacking");

	for (var i = attackerIndex; i < this.players.length; i++) {
		var modIndex = i % this.players.length;
		while (6 - this.players[modIndex].numberOfCards > 0 && this.deck.getNumOfCards() > 0) {
			this.players[modIndex].giveCard(this.deck.removeCard());
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

function takeCardsInPlay() {
	var cards = [];
	for (var i = 0; i < this.cardsInPlay.length; i++) {
		while (this.cardsInPlay[i].length !== 0) {
			cards.push(this.cardsInPlay[i].pop());
		}
	}
	return cards;
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

function getPlayerWithSocket(socket) {
	for (var i = 0; i < this.players.length; i++) {
		if (this.players[i].isSocket(socket)) {
			return this.players[i];
		}
	}
	return false;
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
	var cycle = this.playerStateCycle[this.players.length - 2];
	for (var i = 0; i < this.players.length; i++) {
		this.players[i].setState(cycle[i]);
	}
}

function isFull() {
	return (this.players.length > 3);
}

/**
* Cycle to the next player's turn.
*
* Player states are cycled if current turn is at the end
* of an play cycle or no more cards can be played.
* If the next turn is "waiting", it is skipped.
*/
function nextTurn() {
	var cycle = this.turnCycle[this.players.length - 2];
	var turnIndex = cycle.indexOf(this.currentTurn);
	var nextTurnIndex = (turnIndex + 1) % cycle.length;

	if (cycle[nextTurnindex] === "waiting") {
		nextTurnIndex = (nextTurnIndex + 1) % cycle.length;
	}

	if (turnIndex === cycle.length || noMoreCardsCanBePlayed()) {
		this.cyclePlayerStates();
	}

	this.currentTurn = cycle[nextTurnIndex];

	/**
	* If the defender just played, but no more attack
	* cards can be played, end the round and cycle
	* the states.
	*/
	function noMoreCardsCanBePlayed() {
		return (
			(cycle[turnIndex] === "defending") &&
			(this.players[this.getPlayerIndexForState("defending")].getNumOfCards() === 0 || this.attackCardsPlayedForRound >= 6)
		);
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
	this.attackCardsPlayedForRound = 0;

	this.dealCards();
	this.determineAttackOrder();

	// TODO:
	//	PLAY GAME! :))
}
