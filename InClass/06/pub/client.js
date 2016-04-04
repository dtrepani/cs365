var socket = io();
var pieces = [];

function main() {
	updateBoard();
	socket.on("updatePieces", updatePieces);
}

function updateBoard() {
	var i, j, piece;

	socket.emit("getPieces");
	console.log(pieces);
	$('#board').empty();
	$('#board').append('<table><tr>');

	for (i = 0; i < 13; i++) {
		for (j = 0; j < 13; j++) {
			piece = pieces[i][j] ? '&#8226;' : '';

			$('#board').append("<td class='" + pieces[i][j] + "'>" + piece + "</td>");

			if (i === 12) {
				$('#board').append('</tr>' + (j === 12) ? '' : '<tr>');
			}
		}
	}
	$('#board').append('</table>');
}

function updatePieces(aPieces) {
	pieces = aPieces;
}

$(main);
