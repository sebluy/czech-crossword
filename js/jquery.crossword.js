/**
 * Jesse Weisbeck's Crossword Puzzle (for all 3 people left who want to play them)
 *
 */
(function ($) {
	$.fn.crossword = function (entryData) {
		/*
            Qurossword Puzzle: a javascript + jQuery crossword puzzle
            "light" refers to a white box - or an input

            DEV NOTES:
            - activePosition and activeClueIndex are the primary vars that set the ui whenever there's an interaction
            - 'Entry' is a puzzler term used to describe the group of letter inputs representing a word solution
            - This puzzle isn't designed to securely hide answerers. A user can see answerers in the js source
                - An xhr provision can be added later to hit an endpoint on keyup to check the answerer
            - The ordering of the array of problems doesn't matter. The position & orientation properties is enough information
            - Puzzle authors must provide a starting x,y coordinates for each entry
            - Entry orientation must be provided in lieu of provided ending x,y coordinates (script could be adjust to use ending x,y coords)
            - Answers are best provided in lower-case, and can NOT have spaces - will add support for that later
        */

		var puzz = {}; // put data array in object literal to namespace it into safety
		puzz.data = entryData;

		// append clues markup after puzzle wrapper div
		// This should be moved into a configuration object
		this.after(
			'<div id="puzzle-clues">' +
			'<h2>Across</h2><table id="across"><tbody></tbody></table>' +
			'<h2>Down</h2><table id="down"><tbody></tbody></table>' +
			'</div>'
		);

		// initialize some variables
		var tbl = ['<table id="puzzle">'],
			puzzEl = this,
			clues = $('#puzzle-clues'),
			clueLiEls,
			coords,
			entryCount = puzz.data.length,
			entries = [],
			rows = [],
			cols = [],
			solved = [],
			$actives,
			activePosition = 0,
			activeClueIndex = 0,
			currOri,
			mode = 'interacting',
			solvedToggle = false,
			z = 0;

		let keyCodes = {
			backspace: 8,
			tab: 9,
			left_arrow: 37,
			up_arrow: 38,
			right_arrow: 39,
			down_arrow: 40,
			delete: 46,
		};

		var puzInit = {

			init: function () {
				currOri = 'across'; // app's init orientation could move to config object

				// Reorder the problems array ascending by POSITION
				puzz.data.sort(function (a, b) {
					return a.position - b.position;
				});

				puzzEl.delegate('input', 'input', function (e) {
					console.log('input keyup: ' + solvedToggle);
					puzInit.checkAnswer(e);
				});

				// Set keyup handlers for the 'entry' inputs that will be added presently
				puzzEl.delegate('input', 'keyup', function (e) {
					mode = 'interacting';

					// need to figure out orientation up front, before we attempt to highlight an entry
					switch (e.which) {
						case keyCodes.left_arrow:
						case keyCodes.right_arrow:
							currOri = 'across';
							break;
						case keyCodes.up_arrow:
						case keyCodes.down_arrow:
							currOri = 'down';
							break;
						default:
							break;
					}

					if (e.keyCode === keyCodes.tab) {
						return false;
					} else if (
						e.keyCode === keyCodes.left_arrow ||
						e.keyCode === keyCodes.right_arrow ||
						e.keyCode === keyCodes.up_arrow ||
						e.keyCode === keyCodes.down_arrow ||
						e.keyCode === keyCodes.backspace ||
						e.keyCode === keyCodes.delete) {

						if (e.keyCode === keyCodes.backspace || e.keyCode === keyCodes.delete) {
							currOri === 'across' ?
								nav.nextPrevNav(e, keyCodes.left_arrow) :
								nav.nextPrevNav(e, keyCodes.up_arrow);
						} else {
							nav.nextPrevNav(e);
						}

						e.preventDefault();
						return false;
					}

					e.preventDefault();
					return false;
				});

				// tab navigation handler setup
				puzzEl.delegate('input', 'keydown', function (e) {

					if (e.keyCode === keyCodes.tab) {

						mode = "setting ui";
						if (solvedToggle) solvedToggle = false;

						//puzInit.checkAnswer(e)
						nav.updateByEntry(e);

					} else {
						return true;
					}

					e.preventDefault();

				});

				// tab navigation handler setup
				puzzEl.delegate('input', 'click', function (e) {
					mode = "setting ui";
					if (solvedToggle) solvedToggle = false;

					console.log('input click: ' + solvedToggle);

					nav.updateByEntry(e);
					e.preventDefault();

				});


				// click/tab clues 'navigation' handler setup
				clues.delegate('li', 'click', function (e) {
					mode = 'setting ui';

					if (!e.keyCode) {
						nav.updateByNav(e);
					}
					e.preventDefault();
				});


				// highlight the letter in selected 'light' - better ux than making user highlight letter with second action
				puzzEl.delegate('#puzzle', 'click', function (e) {
					$(e.target).focus();
					$(e.target).select();
				});

				// DELETE FOR BG
				puzInit.calcCoords();

				// Puzzle clues added to DOM in calcCoords(), so now immediately put mouse focus on first clue
				clueLiEls = $('#puzzle-clues .clue');
				$('#' + currOri + ' td').eq(0).addClass('clues-active').focus();

				// DELETE FOR BG
				puzInit.buildTable();
				puzInit.buildEntries();

			},

			/*
                - Given beginning coordinates, calculate all coordinates for entries, puts them into entries array
                - Builds clue markup and puts screen focus on the first one
            */
			calcCoords: function () {
				/*
                    Calculate all puzzle entry coordinates, put into entries array
                */
				for (var i = 0, p = entryCount; i < p; ++i) {
					// set up array of coordinates for each problem
					entries.push(i);
					entries[i] = [];

					for (var x = 0, j = puzz.data[i].answer.length; x < j; ++x) {
						entries[i].push(x);
						coords = puzz.data[i].orientation === 'across' ? "" + puzz.data[i].startx++ + "," + puzz.data[i].starty + "" : "" + puzz.data[i].startx + "," + puzz.data[i].starty++ + "";
						entries[i][x] = coords;
					}

					// while we're in here, add clues to DOM!
                    let onclick = '$(this).text(\"' + puzz.data[i].answer + '\")';
					let button = '<button onclick=\'' + onclick + '\'>Solution</button>';
					$('#' + puzz.data[i].orientation).append(
					    '<tr>' +
						'<td class="clue" tabindex="1" data-position="' + i + '">' + puzz.data[i].clue + '</td>' +
						'<td>' + button + '</td>'
					);
				}

				// Calculate rows/cols by finding max coords of each entry, then picking the highest
				for (var i = 0, p = entryCount; i < p; ++i) {
					for (var x = 0; x < entries[i].length; x++) {
						cols.push(entries[i][x].split(',')[0]);
						rows.push(entries[i][x].split(',')[1]);
					}
					;
				}

				rows = Math.max.apply(Math, rows) + "";
				cols = Math.max.apply(Math, cols) + "";

			},

			/*
                Build the table markup
                - adds [data-coords] to each <td> cell
            */
			buildTable: function () {
				for (var i = 1; i <= rows; ++i) {
					tbl.push("<tr>");
					for (var x = 1; x <= cols; ++x) {
						tbl.push('<td data-coords="' + x + ',' + i + '"></td>');
					}
					;
					tbl.push("</tr>");
				}
				;

				tbl.push("</table>");
				puzzEl.append(tbl.join(''));
			},

			/*
                Builds entries into table
                - Adds entry class(es) to <td> cells
                - Adds tabindexes to <inputs>
            */
			buildEntries: function () {
				var puzzCells = $('#puzzle td'),
					light,
					$groupedLights,
					hasOffset = false,
					positionOffset = entryCount - puzz.data[puzz.data.length - 1].position; // diff. between total ENTRIES and highest POSITIONS

				for (var x = 1, p = entryCount; x <= p; ++x) {
					var letters = puzz.data[x - 1].answer.split('');

					for (var i = 0; i < entries[x - 1].length; ++i) {
						light = $(puzzCells + '[data-coords="' + entries[x - 1][i] + '"]');

						// check if POSITION property of the entry on current go-round is same as previous.
						// If so, it means there's an across & down entry for the position.
						// Therefore you need to subtract the offset when applying the entry class.
						if (x > 1) {
							if (puzz.data[x - 1].position === puzz.data[x - 2].position) {
								hasOffset = true;
							}
						}

						if ($(light).empty()) {
							$(light)
								.addClass('entry-' + (hasOffset ? x - positionOffset : x) + ' position-' + (x - 1))
								.append('<input maxlength="1" val="" type="text" tabindex="-1" />');
						}
					}
				}

				// Put entry number in first 'light' of each entry, skipping it if already present
				for (var i = 1, p = entryCount; i < p; ++i) {
					$groupedLights = $('.entry-' + i);
					if (!$('.entry-' + i + ':eq(0) span').length) {
						$groupedLights.eq(0)
							.append('<span>' + puzz.data[i].position + '</span>');
					}
				}

				util.highlightEntry();
				util.highlightClue();
				$('.active').eq(0).focus();
				$('.active').eq(0).select();

			},


			/*
                - Checks current entry input group value against answer
                - If not complete, auto-selects next input for user
            */
			checkAnswer: function (e) {

				var valToCheck, currVal;

				util.getActivePositionFromClassGroup($(e.target));

				valToCheck = puzz.data[activePosition].answer.toLowerCase();

				let wordInputs = $('.position-' + activePosition + ' input')
				currVal = wordInputs
					.map(function () {
						return $(this)
							.val()
							.toLowerCase();
					})
					.get()
					.join('');

				//console.log(currVal + " " + valToCheck);
				if (valToCheck === currVal) {
					$('.active')
						.addClass('done')
						.removeClass('active');

					$('.clues-active').addClass('clue-done');

					solved.push(valToCheck);
					wordInputs.attr('disabled', true);
					solvedToggle = true;
				}

				currOri === 'across' ?
					nav.nextPrevNav(e, keyCodes.right_arrow) :
					nav.nextPrevNav(e, keyCodes.down_arrow);

				//z++;
				//console.log(z);
				//console.log('checkAnswer() solvedToggle: '+solvedToggle);

			}


		}; // end puzInit object


		var nav = {

			nextPrevNav: function (e, override) {

				var len = $actives.length,
					struck = override ? override : e.which,
					el = $(e.target),
					p = el.parent(),
					ps = el.parents(),
					selector;

				util.getActivePositionFromClassGroup(el);
				util.highlightEntry();
				util.highlightClue();

				$('.current').removeClass('current');

				selector = '.position-' + activePosition + ' input';

				//console.log('nextPrevNav activePosition & struck: '+ activePosition + ' '+struck);

				// move input focus/select to 'next' input
				switch (struck) {
					case keyCodes.right_arrow:
						p
							.next()
							.find('input')
							.addClass('current')
							.select();

						break;

					case keyCodes.left_arrow:
						p
							.prev()
							.find('input')
							.addClass('current')
							.select();

						break;

					case keyCodes.down_arrow:
						ps
							.next('tr')
							.find(selector)
							.addClass('current')
							.select();

						break;

					case keyCodes.up_arrow:
						ps
							.prev('tr')
							.find(selector)
							.addClass('current')
							.select();

						break;

					default:
						break;
				}

			},

			updateByNav: function (e) {
				var target;

				$('.clues-active').removeClass('clues-active');
				$('.active').removeClass('active');
				$('.current').removeClass('current');
				currIndex = 0;

				target = e.target;
				activePosition = $(e.target).data('position');

				util.highlightEntry();
				util.highlightClue();

				$('.active').eq(0).focus();
				$('.active').eq(0).select();
				$('.active').eq(0).addClass('current');

				// store orientation for 'smart' auto-selecting next input
				currOri = $('.clues-active').parents('table').prop('id');

				activeClueIndex = $(clueLiEls).index(e.target);
				//console.log('updateByNav() activeClueIndex: '+activeClueIndex);

			},

			// Sets activePosition var and adds active class to current entry
			updateByEntry: function (e, next) {
				var classes, next, clue, e1Ori, e2Ori, e1Cell, e2Cell;

				if (e.keyCode === keyCodes.tab || next) {
					// handle tabbing through problems, which keys off clues and requires different handling
					activeClueIndex = activeClueIndex === clueLiEls.length - 1 ? 0 : ++activeClueIndex;

					$('.clues-active').removeClass('.clues-active');

					next = $(clueLiEls[activeClueIndex]);
					currOri = next.parents('table').prop('id');
					activePosition = $(next).data('position');

					// skips over already-solved problems
					util.getSkips(activeClueIndex);
					activePosition = $(clueLiEls[activeClueIndex]).data('position');


				} else {
					activeClueIndex = activeClueIndex === clueLiEls.length - 1 ? 0 : ++activeClueIndex;

					util.getActivePositionFromClassGroup(e.target);

					clue = $(clueLiEls + '[data-position=' + activePosition + ']');
					activeClueIndex = $(clueLiEls).index(clue);

					currOri = clue.parents('table').prop('id');

				}

				util.highlightEntry();
				util.highlightClue();

				//$actives.eq(0).addClass('current');
				//console.log('nav.updateByEntry() reports activePosition as: '+activePosition);
			}

		}; // end nav object


		var util = {
			highlightEntry: function () {
				// this routine needs to be smarter because it doesn't need to fire every time, only
				// when activePosition changes
				$actives = $('.active');
				$actives.removeClass('active');
				$actives = $('.position-' + activePosition + ' input').addClass('active');
				$actives.eq(0).focus();
				$actives.eq(0).select();
			},

			highlightClue: function () {
				var clue;
				$('.clues-active').removeClass('clues-active');
				$(clueLiEls + '[data-position=' + activePosition + ']').addClass('clues-active');

				if (mode === 'interacting') {
					clue = $(clueLiEls + '[data-position=' + activePosition + ']');
					activeClueIndex = $(clueLiEls).index(clue);
				}
				;
			},

			getClasses: function (light, type) {
				if (!light.length) return false;

				var classes = $(light).prop('class').split(' '),
					classLen = classes.length,
					positions = [];

				// pluck out just the position classes
				for (var i = 0; i < classLen; ++i) {
					if (!classes[i].indexOf(type)) {
						positions.push(classes[i]);
					}
				}

				return positions;
			},

			getActivePositionFromClassGroup: function (el) {

				classes = util.getClasses($(el).parent(), 'position');

				if (classes.length > 1) {
					// get orientation for each reported position
					e1Ori = $(clueLiEls + '[data-position=' + classes[0].split('-')[1] + ']').parent().prop('id');
					e2Ori = $(clueLiEls + '[data-position=' + classes[1].split('-')[1] + ']').parent().prop('id');

					// test if clicked input is first in series. If so, and it intersects with
					// entry of opposite orientation, switch to select this one instead
					e1Cell = $('.position-' + classes[0].split('-')[1] + ' input').index(el);
					e2Cell = $('.position-' + classes[1].split('-')[1] + ' input').index(el);

					if (mode === "setting ui") {
						currOri = e1Cell === 0 ? e1Ori : e2Ori; // change orientation if cell clicked was first in a entry of opposite direction
					}

					if (e1Ori === currOri) {
						activePosition = classes[0].split('-')[1];
					} else if (e2Ori === currOri) {
						activePosition = classes[1].split('-')[1];
					}
				} else {
					activePosition = classes[0].split('-')[1];
				}

				console.log('getActivePositionFromClassGroup activePosition: ' + activePosition);

			},

			checkSolved: function (valToCheck) {
				for (var i = 0, s = solved.length; i < s; i++) {
					if (valToCheck === solved[i]) {
						return true;
					}

				}
			},

			getSkips: function (position) {
				if ($(clueLiEls[position]).hasClass('clue-done')) {
					activeClueIndex = position === clueLiEls.length - 1 ? 0 : ++activeClueIndex;
					util.getSkips(activeClueIndex);
				} else {
					return false;
				}
			}

		}; // end util object


		puzInit.init();


	}

})(jQuery);