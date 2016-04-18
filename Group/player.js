"use strict"
var card = require("./card.js");

module.exports = {
	Player: Player
};

// TODO:
//	Setup mongoDB so that player knows its total wins and total games

function Player(aUsername, aSocket) {
	this.cards = [];
	this.socket = aSocket;
	this.state = "waiting";
	this.username = aUsername;
}

Player.prototype = {
	getCard: getCard,
	getCards: getCards,
	getLowestTrump: getLowestTrump,
	getSocket: getSocket,
	getState: getState,
	getName: getName,
	giveCard: giveCard,
	isReady: isReady,
	isSocket: isSocket,
	numberOfCards: numberOfCards,
	playCard: playCard,
	setSocket: setSocket,
	setState: setState,
	setUsername: setUsername,
	takeCards: takeCards
};

function getCard(cardIndex) {
	return this.cards[cardIndex];
}

function getCards() {
	return this.cards;
}

/**
* @return {Card Object|false}	Card with the lowest number of the trump suit or
*								false if player has no trump suit in their hand.
*/
function getLowestTrump(trumpSuit) {
	var lowestCard = false;
	for (var i = 0; i < this.cards.length; i++) {
		if (this.cards[i].getSuit() === trumpSuit &&
			(!lowestCard || this.cards[i].getNumber() < lowestCard.getSuit())
		) {
			lowestCard = this.cards[i];
		}
	}
	return lowestCard;
}

function getName() {
	return this.username;
}

function getSocket() {
	return this.socket;
}

function getState() {
	return this.state;
}

function giveCard(aCard) {
	this.cards.push(aCard);
}

function isReady() {
	return (this.state === 'ready');
}

function isSocket(aSocket) {
	return (this.socket === aSocket);
}

function numberOfCards() {
	return this.cards.length;
}

/**
* @return {Card Object}
*/
function playCard(cardIndex) {
	return this.cards.splice(cardIndex, 1)[0];
}

function setSocket(aSocket) {
	this.socket = aSocket;
}

/**
* @param {string} aState	States are defending, attacking,
*							supporting, ready, and waiting.
*/
function setState(aState) {
	this.state = aState;
}

function setUsername(aUsername) {
	this.username = aUsername;
}

function takeCards(aCards) {
	while (aCards.length !== 0) {
		this.cards.push(aCards.pop());
	}
}
