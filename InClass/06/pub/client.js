'use strict';

var socket = io();
var pieces = [];
var status = '';
var boardSize = 13;

function main() {
	socket.emit('getData');
	socket.on('updateData', updateData);
	socket.on('setRole', setRole);

	setupClicks();

	// Firefox error fix
	$(window).on('beforeunload', function(){
    	socket.close();
	});
}

function getAppend(i, j) {
	var piece, pieceClass;
	if (pieces[i][j] === null) {
		piece = '+';
		pieceClass = 'none';
	} else {
		piece = '&#11044;';
		pieceClass = pieces[i][j];
	}
	return "<td class='" + pieceClass + "'>" + piece + "</td>";
}

function setRole(role) {
	$('#role').html("<div class='" + role + "'>" + role + "</div>");
}

function setupClicks() {
	$("#board").on(
		"click",
		"td",
		function() {
			var row = $(this).closest("tr").index();
			var col = $(this).index();

			socket.emit('makeMove', {row: row, col: col});
		}
	);
}

function updateView() {
	var i, j, piece;
	var board = "";

	$("#status").html(status);

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
	updateView();
}

$(main);
