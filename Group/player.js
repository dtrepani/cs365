"use strict"
module.exports = {
	Player: Player
};

function Player(socket) {
	this.cards = [];
	this.socket = socket;
	this.state = "";
	this.username = "";
}

Player.prototype = {
	getState: getState,
	getUsername: getUsername,
	giveCard: giveCard,
	isSocket: isSocket,
	playCard: playCard,
	setSocket: setSocket,
	setState: setState,
	setUsername: setUsername
};

function getState() {
	return this.state;
}

function getUsername() {
	return this.username;
}

function giveCard(aCard) {
	this.cards.push(aCard);
}

function isSocket(aSocket) {
	return (this.socket === aSocket);
}

function playCard() {

}

function setSocket(aSocket) {
	this.socket = aSocket;
}

/**
* @param {string} aState	States are defending, attacking,
*							supporting, and waiting
*/
function setState(aState) {
	this.state = aState;
}

function setUsername(aUsername) {
	this.username = aUsername;
}
