'use strict'
module.exports = {
	Player: Player
};

function Player(socket, color) {
		this.socket = socket;
		this.color = color;
		this.score = 0;
		this.pieces = null;
}

Player.prototype = {
	captureAnyPieces: captureAnyPieces,
	checkForCapture: checkForCapture,
	getScore: getScore,
	isColor: isColor,
	isPlayerPiece: isPlayerPiece,
	isOtherPlayersPiece: isOtherPlayersPiece,
	isSocket: isSocket,
	makeMove: makeMove,
	setScore: setScore,
	setSocket: setSocket
};


function captureAnyPieces(row, col) {
	/**
	other && other; this
	diagonals:
		-2, -2 && -1, -1; -3, -3
		-2,  2 && -1,  1; -3,  3
		 2, -2 &&  1, -1;  3, -3
		 2,  2 &&  1,  1;  3,  3
	straights:
		0, -2 && 0, -1;  0, -3
		0,  2 && 0,  1;  0,  3
		-2, 0 && -1, 0; -3, 0
		 2, 0 &&  1, 0;  3, 0
	*/
	for (var i = -1; i <= 1; i++) {
		for (var j = -1; j <= 1; j++) {
			if (!(i === 0 && j===0)) {
				this.checkForCapture(row, col, i, j);
			}
		}
	}
}

// Board size is 13, so rows and cols are between 0 and 12.
function isOutsideBounds(row, col) {
	return (row < 0 || col < 0 || row > 12 || col > 12);
}

function checkForCapture(row, col, rowMultiplier, colMultiplier) {
	var rows = [];
	var cols = [];

	for (var i = 1; i <= 3; i++) {
		rows.push(row + i * rowMultiplier);
		cols.push(col + i * colMultiplier);
	}

	if (isOutsideBounds(rows[2], cols[2])) {
		return;
	}

	if (this.isPlayerPiece(this.pieces[rows[2]][cols[2]])
	) {
		if (this.isOtherPlayersPiece(this.pieces[rows[1]][cols[1]]) &&
			this.isOtherPlayersPiece(this.pieces[rows[0]][cols[0]])
		) {
			this.pieces[rows[1]][cols[1]] = null;
			this.pieces[rows[0]][cols[0]] = null;
			this.score += 2;
		}
	}
}

function getScore() {
	return this.score;
}

function isColor(aColor) {
	return (this.color === aColor);
}

function isPlayerPiece(piece) {
	return (piece === this.color);
}

function isPlayerTurn(redTurn) {
	return ((redTurn && this.color === 'red') ||
			(!redTurn && this.color === 'black'));
}

function isOtherPlayersPiece(piece) {
	var otherColor = (this.color === 'red') ? 'black' : 'red';
	return (piece === otherColor);
}

function isSocket(aSocket) {
	return (this.socket === aSocket);
}

function makeMove(socket, aPieces, row, col) {
	this.pieces = aPieces;
	if(this.isSocket(socket) && !this.pieces[row][col]) {
		this.pieces[row][col] = this.color;
		this.captureAnyPieces(row, col);
		return {
			'success': true,
			'pieces': this.pieces
		};
	}
	return {
		'success': false,
		'pieces':this.pieces
	};
}

function setScore(aScore) {
	this.score = aScore;
}

function setSocket(aSocket) {
	this.socket = aSocket;
}
