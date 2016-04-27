'use strict'
module.exports = {
	Player: Player
};

function Player(socket, aLetter) {
		this.socket = socket;
		this.letter = aLetter;
		this.score = 0;
		this.pieces = null;
}

Player.prototype = {
	checkForWinWithPieces: checkForWinWithPieces,
	checkForWin: checkForWin,
	getScore: getScore,
	isLetter: isLetter,
	isPlayerPiece: isPlayerPiece,
	isOtherPlayersPiece: isOtherPlayersPiece,
	isSocket: isSocket,
	playLetter: playLetter,
	setScore: setScore,
	setSocket: setSocket
};


function checkForWinWithPieces(row, col) {
	for (var i = -1; i <= 1; i++) {
		for (var j = -1; j <= 1; j++) {
			if (!(i === 0 && j===0)) {
				if (this.checkForWin(row, col, i, j)) {
					return true;
				}
			}
		}
	}
	return false;
}

// Board size is 3, so rows and cols are between 0 and 2.
function isOutsideBounds(row, col) {
	return (row < 0 || col < 0 || row > 2 || col > 2);
}

function checkForWin(row, col, rowMultiplier, colMultiplier) {
	var rows = [];
	var cols = [];

	for (var i = 1; i <= 2; i++) {
		rows.push(row + i * rowMultiplier);
		cols.push(col + i * colMultiplier);
	}

	if (isOutsideBounds(rows[1], cols[1])) {
		return false;
	}

	if (this.isPlayerPiece(this.pieces[rows[1]][cols[1]] )&&
		this.isPlayerPiece(this.pieces[rows[0]][cols[0]])
	) {
			this.score += 1;
			return true;
	}
	return false;
}

function getScore() {
	return this.score;
}

function isLetter(aLetter) {
	return (this.letter === aLetter);
}

function isPlayerPiece(piece) {
	return (piece === this.letter);
}

function isPlayerTurn(mTurn) {
	return ((mTurn && this.letter === 'm') ||
			(!mTurn && this.letter === 'o'));
}

function isOtherPlayersPiece(piece) {
	var otherType = (this.letter === 'm') ? 'o' : 'm';
	return (piece === otherType);
}

function isSocket(aSocket) {
	return (this.socket === aSocket);
}

function playLetter(socket, aPieces, row, col) {
	this.pieces = aPieces;
	if(this.isSocket(socket) && !this.pieces[row][col]) {
		this.pieces[row][col] = this.letter;
		var winMade = this.checkForWinWithPieces(row, col);
		return {
			success: true,
			winMade: winMade,
			pieces: this.pieces
		};
	}
	return {
		success: false,
		pieces:this.pieces
	};
}

function setScore(aScore) {
	this.score = aScore;
}

function setSocket(aSocket) {
	this.socket = aSocket;
}
