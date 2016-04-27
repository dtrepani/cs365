'use strict';

var socket = io();
var pieces = [];
var scores = {};
var status = '';
var boardSize = 3;

function main() {
	socket.emit('getData');
	socket.on('updateData', updateData);
	socket.on('setRole', setRole);
	socket.on('mWon', mWon);
	socket.on('oWon', oWon);
	socket.on('resetClient', resetClient);

	setupClicks();
}

function getAppend(i, j) {
	var piece, pieceClass;
	if (pieces[i][j] === null) {
		piece = ''
	} else {
		piece = pieces[i][j];
	}
	return "<td class='" + piece + "'>" + piece.toUpperCase() + "</td>";
}

function setRole(role) {
	$('#role').html("<div class='" + role + "'>" + role + "</div>");
}

function setupClicks() {
	$(".reset").click(resetServer);
	$("#board").on(
		"click",
		"td",
		function() {
			var row = $(this).closest("tr").index();
			var col = $(this).index();

			socket.emit('playLetter', {row: row, col: col});
		}
	);
}

function updateView() {
	var i, j, piece;
	var board = "";

	$("#status").html(status);
	$("#score-m").html("M: " + scores.m);
	$("#score-o").html("O: " + scores.o);

	for(var i = 0; i < boardSize; i++) {
		board += "<tr>";
 		for (var j = 0; j < boardSize; j++) {
			board += getAppend(i, j);
		}
		board += "</tr>";
	}

	$("#board").html(board);
}

function updateData(data) {
	status = data.status
	pieces = data.pieces;
	scores = data.scores;
	updateView();
}

function resetClient() {
	$('.overlay').removeClass('is-visible');
	$('#m-won').removeClass('is-visible');
	$('#o-won').removeClass('is-visible');
}

function resetServer() {
	socket.emit("reset");
}

function mWon() {
	$('.overlay').addClass('is-visible');
	$('#m-won').addClass('is-visible');
}

function oWon() {
	$('.overlay').addClass('is-visible');
	$('#o-won').addClass('is-visible');
}

$(main);
