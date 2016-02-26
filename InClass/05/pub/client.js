var socket = io();

function main() {
	socket.emit("getPos");
	$("#left").click({moveLeft: true}, moveDog);
	$("#right").click({moveLeft: false}, moveDog);
	$("#reset").click(reset);
	socket.on("updatePos", moveToPosition);
	socket.on("gameWon", gameWon); // TODO: may not need to know who won. Let server tell clients if they won or lost
}

function moveDog(event) {
	socket.emit("moveDog", event.data.moveLeft);
}

function reset() {
	$('.overlay').removeClass('is-visible');
	$('#win').removeClass('is-visible');
	$('#lose').removeClass('is-visible');
	socket.emit("reset");
}

function gameWon(leftWon) {
	userWon();
}

function userWon() {
	$('.overlay').addClass('is-visible');
	$('#win').addClass('is-visible');
}

function userLost() {
	$('.overlay').addClass('is-visible');
	$('#lose').addClass('is-visible');
}

function moveToPosition(pos) {
	$("#foreground").css("left", pos+"px");
}

$(main);
