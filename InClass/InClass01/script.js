"use strict";

var	companionSelected = false;

var Companion = function(aName, aEats, aButtonName) {
	this.name = aName;
	this.eats = aEats;
	this.leftSideOfRiver = true;
	this.buttonName = aButtonName;
};

Companion.prototype.writeHTML = function() {
	return "<input type=\"button\" value=\"" + this.name + "\"" + ((this.name == 'You') ? "class=\"disabled\"" : "") + ">";
};

var	you		= new Companion('You', null, 'input[type="button"][value="You"]'),
	wolf	= new Companion('Wolf', 'Goat', 'input[type="button"][value="Wolf"]'),
	goat	= new Companion('Goat', 'Cabbage', 'input[type="button"][value="Goat"]'),
	cabbage	= new Companion('Cabbage', null, 'input[type="button"][value="Cabbage"]');

var companions = [wolf, goat, cabbage];

var updateCompanions = function() {
	var	i,
		containerLeft = '',
		containerRight = '';
	you.leftSideOfRiver = !you.leftSideOfRiver;

	if(you.leftSideOfRiver) {
		containerLeft += you.writeHTML();
	} else {
		containerRight += you.writeHTML();
	}

	for (i = 0; i < companions.length; i++) {
		if($(companions[i].buttonName).hasClass('disabled')) {
			companions[i].leftSideOfRiver = !companions[i].leftSideOfRiver;
		}

		if(companions[i].leftSideOfRiver) {
			containerLeft += companions[i].writeHTML();
		} else {
			containerRight += companions[i].writeHTML();
		}
	}

	$('#left-side').html(containerLeft);
	$('#right-side').html(containerRight);

	for (i = 0; i < companions.length; i++) {
		$(companions[i].buttonName).removeClass('disabled');
	}

	companionSelected = false;
};

function buttonClick(event) {
	var button = $(event.data.param);

	if(button.hasClass('disabled')) {
		companionSelected = false;
		button.removeClass('disabled');
	} else if(!companionSelected) {
		companionSelected = true;
		button.addClass('disabled');
	}
}

function initClicks() {
	for (var i = 0; i < companions.length; i++) {
		$(companions[i].buttonName).click({ param: companions[i].buttonName }, buttonClick);
	}

	$('#go').click(updateCompanions);
}

$(function() {
	initClicks();
});