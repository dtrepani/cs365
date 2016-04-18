"use strict"

var card = require("./card.js");

module.exports = {
	Deck: Deck
};

function Deck(aNumberOfCards) {
	if (aNumberOfCards > 0) {
		this.generateAllCards();
		this.shuffle(aNumberOfCards);
		this.trump = this.cards.pop();
	}
}

Deck.prototype = {
	addCard: addCard,
	addCards: addCards,
	generateAllCards: generateAllCards,
	getNumOfCards: getNumOfCards,
	getTrump: getTrump,
	shuffle: shuffle,
	removeCard: removeCard
};

function addCard(aCard) {
	this.cards.push(aCard);
}

function addCards(aCards) {
	while (aCards !== 0) {
		this.cards.push(aCards.pop());
	}
}

function generateAllCards() {
	var suits = ["hearts", "diamonds", "spades", "clubs"];
	this.allCards = [];

	for (var i = 0; i < 4; i++) {
		for (var j = 6; j <= 13; j++) {
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

function shuffle(numberOfCards) {
	this.cards = [];
	for (var i = 0; i < numberOfCards; i++) {
		var randCard = Math.random() * this.allCards.length;
		this.cards.push(this.allCards.splice(randCard, 1)[0]);
	}
}

function removeCard() {
	return this.cards.pop();
}
