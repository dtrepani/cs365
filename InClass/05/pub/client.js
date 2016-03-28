var socket = io();

function main() {
	socket.emit("getPos");
	$("#tug").click(moveDog);
	$("#reset").click(resetServer);
	socket.on("updatePos", moveToPosition);
	socket.on("leftWon", leftWon);
	socket.on("rightWon", rightWon);
	socket.on("resetClient", resetClient);
}

function moveDog(event) {
	socket.emit("moveDog");
}

function resetClient() {
	$('.overlay').removeClass('is-visible');
	$('#left').removeClass('is-visible');
	$('#right').removeClass('is-visible');
}

function resetServer() {
	socket.emit("reset");
}

function leftWon() {
	$('.overlay').addClass('is-visible');
	$('#left').addClass('is-visible');
}

function rightWon() {
	$('.overlay').addClass('is-visible');
	$('#right').addClass('is-visible');
}

function moveToPosition(pos) {
	$("#foreground").css("left", pos+"px");
}

$(main);
