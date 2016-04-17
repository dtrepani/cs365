"use strict"

var card = require("./card.js");

module.exports = {
	Deck: Deck
};

function Deck(aNumberOfCards) {
	this.cards = new Array(aNumberOfCards);
	if (aNumberOfCards > 0) {
		generateAllCards();
		this.shuffle();
	}
	this.trump = this.cards.pop();
}

Deck.prototype = {
	addCard: addCard,
	generateAllCards: generateAllCards,
	getNumOfCards: getNumOfCards,
	getTrump: getTrump,
	shuffle: shuffle,
	removeCard: removeCard
};

function addCard(aCard) {
	this.cards.push(aCard);
}

function generateAllCards() {
	var suits = ["hearts", "diamonds", "spades", "clubs"];
	this.allCards = [];

	for (var i = 0; i < 4;) {
		for (var j = 1; j <= 13; j++) {
			this.allCards.push(new card.Card(suits[i], j));
		}
	}
}

function getNumOfCards() {
	return this.cards.length;
}

function getTrump() {
	return this.trump;
}

function shuffle() {
	for (var i = 0; i < this.cards.length; i++) {
		var randCard = Math.random() * 52;
		this.deck.push(this.allCards[randCard]);
		this.allCards.splice(randCard, 1);
	}
}

function removeCard() {
	return this.cards.pop();
}
