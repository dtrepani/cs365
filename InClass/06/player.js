'use strict'

function Player(socket, color) {
	this.socket = socket;
	this.color = color;
}

Player.prototype.isPlayer(aSocket) {
	return (this.socket === aSocket);
}

Player.prototype.isColor(aColor) {
	return (this.color === aColor);
}

Player.prototype.pieceBelongsTo(piece) {
	return (piece === color);
}