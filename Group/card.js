"use strict"
module.exports = {
	Card: Card
};

/**
* @param {string} aSuit Suit of card: hearts, spades,
*						diamonds, or clubs.
* @param {int} aNumber	Card number 1-13, where 10 = jack,
*						11 = queen, 12 = king, and 13 = ace.
*/
function Card(aSuit, aNumber) {
	this.suit = aSuit;
	this.number = aNumber;
	this.orientation = "vertical";
}

Card.prototype = {
	getCardSuit: getCardSuit,
	getCardNumber: getCardNumber,
	getOrientation: getOrientation,
	setOrientation: setOrientation
};

function getCardSuit() {
	return this.suit;
}

function getCardNumber() {
	return this.number;
}

function getOrientation() {
	return this.orientation;
}

function setOrientation(anOrientation) {
	this.orientation = anOrientation;
}
