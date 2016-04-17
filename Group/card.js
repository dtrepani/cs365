"use strict"
module.exports = {
	Card: Card
};

// NOTE: Dropped orientation. Would have been different for every player's screen.

/**
* @param {string} aSuit Suit of card: hearts, spades,
*						diamonds, or clubs.
* @param {int} aNumber	Card number 1-13, where 10 = jack,
*						11 = queen, 12 = king, and 13 = ace.
*/
function Card(aSuit, aNumber) {
	this.suit = aSuit;
	this.number = aNumber;
}

Card.prototype = {
	getSuit: getSuit,
	getNumber: getNumber,
	getOrientation: getOrientation,
	setOrientation: setOrientation
};

function getSuit() {
	return this.suit;
}

function getNumber() {
	return this.number;
}

function getOrientation() {
	return this.orientation;
}

function setOrientation(anOrientation) {
	this.orientation = anOrientation;
}
