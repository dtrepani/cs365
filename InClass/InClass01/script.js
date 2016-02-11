"use strict";

var Companion = function(aName, aEats) {
	this.name = aName;
	this.eats = aEats;
	this.leftSideOfRiver = true;
	this.buttonName = 'input[type="button"][value="' + aName + '"]';
};

Companion.prototype.writeHTML = function() {
	return "<input type=\"button\" value=\"" + this.name + "\"" + ((this.name == 'You') ? "class=\"disabled\"" : "") + ">";
};

Companion.prototype.isOnSameSideAs = function(companion) {
	return (this.leftSideOfRiver == companion.leftSideOfRiver);
};

var	you		= new Companion('You', null),
	wolf	= new Companion('Wolf', 'Goat'),
	goat	= new Companion('Goat', 'Cabbage'),
	cabbage	= new Companion('Cabbage', null);
var companions = [wolf, goat, cabbage];
var	companionSelected = false;

var updateCompanions = function() {
	var	i;

	checkAndMoveToProperSideOfRiver(you);
	for (i = 0; i < companions.length; i++) {
		checkAndMoveToProperSideOfRiver(companions[i]);
	}

	companionSelected = false;
	for (i = 0; i < companions.length; i++) {
		$(companions[i].buttonName).removeClass('disabled');
	}

	checkForGameOver();
	checkForWin();
};

var reset = function() {
	you.leftSideOfRiver = false;
	checkAndMoveToProperSideOfRiver(you);
	for(var i = 0; i < companions.length; i++) {
		companions[i].leftSideOfRiver = true;
		checkAndMoveToProperSideOfRiver(companions[i]);
	}

	companionSelected = false;

	$('.overlay').removeClass('is-visible');
	$('#win').removeClass('is-visible');
	$('#game-over p').remove();
	$('#game-over').removeClass('is-visible');
};

function checkAndMoveToProperSideOfRiver(companion) {
	if($(companion.buttonName).hasClass('disabled')) companion.leftSideOfRiver = !companion.leftSideOfRiver;
	$(companion.buttonName).appendTo((companion.leftSideOfRiver) ? $('#left-side') : $('#right-side'));
}

function getCompanionIndex(companionName) {
	for(var i = 0; i < companions.length; i++) {
		if(companions[i].name == companionName) {
			return i;
		}
	}
	return -1;
}

function checkForGameOver() {
	var gameOver = false;
	var deathMsg = $('<p />');

	for(var i = 0; i < companions.length; i++) {
		if(!companions[i].isOnSameSideAs(you)) {
			var indexOfPrey = getCompanionIndex(companions[i].eats);
			if((indexOfPrey != -1) && companions[i].isOnSameSideAs(companions[indexOfPrey])) {
				deathMsg.append("The " + companions[i].name + " ate the " + companions[i].eats + "!");
				gameOver = true;
				break;
			}
		}
	}

	if(gameOver) {
		$('.overlay').addClass('is-visible');
		$('#game-over h1').after(deathMsg);
		$('#game-over').addClass('is-visible');
	}
}

function checkForWin() {
	var win = true;

	if(you.leftSideOfRiver) win = false;
	for(var i = 0; i < companions.length; i++) {
		if(companions[i].leftSideOfRiver) {
			win = false;
			break;
		}
	}

	if(win) {
		$('.overlay').addClass('is-visible');
		$('#win').addClass('is-visible');
	}
}

function buttonClick(event) {
	var	companion = event.data.param,
		button = $(companion.buttonName);

	if(button.hasClass('disabled')) {
		companionSelected = false;
		button.removeClass('disabled');
	} else if(!companionSelected && (companion.isOnSameSideAs(you))) {
		companionSelected = true;
		button.addClass('disabled');
	}
}

function initClicks() {
	for (var i = 0; i < companions.length; i++) {
		$(companions[i].buttonName).click({ param: companions[i] }, buttonClick);
	}
	$('#go').click(updateCompanions);

	$('input[type="button"][value="Reset?"]').click(reset);
}

$(function() {
	initClicks();
});