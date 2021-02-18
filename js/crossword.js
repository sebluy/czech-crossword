class Crossword {

    // TODO:
    // Add position labels
    // Fix x - 1, y - 1

    constructor(data) {
        this.data = this.sortData(data);
        this.$parent = $('#puzzle-wrapper');
        this.entryIndex = 0;
        this.createBoard();
        this.renderBoard();
        this.renderHints();
        this.highlightEntry();
        this.attachEvents();
        this.keyCodes = {
            backspace: 8,
            tab: 9,
            left_arrow: 37,
            up_arrow: 38,
            right_arrow: 39,
            down_arrow: 40,
            delete: 46,
        };
    }

    sortData(data) {
        return data.sort((a, b) => {
            let aO = a.orientation === 'across' ? 0 : 1;
            let bO = b.orientation === 'across' ? 0 : 1;
            if (aO < bO) return -1;
            if (bO < aO) return 1;
            if (a.starty < b.starty) return -1;
            if (b.starty < a.starty) return 1;
            if (a.startx < b.startx) return -1;
            if (b.startx < a.startx) return 1;
            return 0;
        });
    }

    createBoard() {
        let maxX = 0;
        let maxY = 0;
        for (let i in this.data) {
            let entry = this.data[i];
            let x = entry.startx - 1;
            let y = entry.starty - 1;
            if (entry.orientation === 'across') x += entry.answer.length;
            else y += entry.answer.length;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }
        this.grid = [];
        for (let j = 0; j < maxY; j++) {
            this.grid[j] = [];
            for (let i = 0; i < maxX; i++) {
                this.grid[j][i] = null;
            }
        }
        for (let i in this.data) {
            let entry = this.data[i];
            this.addEntry(i, entry);
        }
    }

    addEntry(entryIndex, entry) {
        let x = entry.startx - 1;
        let y = entry.starty - 1;
        let orientation = entry.orientation;
        let answer = entry.answer;
        let letters = answer.split('');
        entry.coords = [];
        for (let i in letters) {
            if (this.grid[y][x] === null) {
                this.grid[y][x] = {
                    answer: letters[i],
                };
            }
            this.grid[y][x][orientation] = entryIndex;
            entry.coords.push([x, y]);
            if (orientation === 'across') x++;
            else y++;
        }
    }

    renderBoard() {
        let tbl = ['<table id="puzzle"><tbody>'];
        for (let y = 0; y < this.grid.length; y++) {
            tbl.push('<tr>');
            for (let x = 0; x < this.grid[y].length; x++) {
                tbl.push('<td>');
                if (this.grid[y][x]) {
                    let coord = x + ',' + y;
                    tbl.push(`<input data-coord="${coord}"/>`);
                }
                tbl.push('</td>');
            }
            tbl.push('</tr>');
        }
        tbl.push('</tbody></table>');
        this.$parent.append(tbl.join(''));
    }

    renderHints() {
        let clues = ['<div id="puzzle-clues">'];
        clues.push('<h2>Across</h2><table id="across"><tbody></tbody></table>');
        clues.push('<h2>Down</h2><table id="down"><tbody></tbody></table>')
        clues.push('</div>');
        this.$parent.after(clues.join(''));
        for (let i in this.data) {
            let entry = this.data[i];
            let onclick = `$(this).text(\"${entry.answer}\")`;
            let button = `<button onclick='${onclick}'>Solution</button>`;
            $('#' + entry.orientation).append(
                `<tr><td class="clue" data-entry="${i}">${entry.clue}</td><td>${button}</td>`
            );
        }
    }

    attachEvents() {
        let that = this;
        this.$parent.delegate('input', 'input', function (e) {
            if ($(this).val() === '') return;
            that.checkSolved();
            let coord = that.getCoord($(this));
            let nextCoord = that.nextCoord(coord);
            that.lookupUnsolvedInput(nextCoord).select();
        });
        this.$parent.delegate('input', 'keydown', function (e) {
            if (e.keyCode === that.keyCodes.tab) {
                let nextCoord = that.goToNextWord();
                that.lookupUnsolvedInput(nextCoord).select();
                e.preventDefault();
            }
            if (e.keyCode === that.keyCodes.down_arrow) {
                let coord = that.getCoord($(this));
                coord[1]++;
                that.trySelect(coord);
                e.preventDefault();
            }
            if (e.keyCode === that.keyCodes.up_arrow) {
                let coord = that.getCoord($(this));
                coord[1]--;
                that.trySelect(coord);
                e.preventDefault();
            }
            if (e.keyCode === that.keyCodes.left_arrow) {
                let coord = that.getCoord($(this));
                coord[0]--;
                that.trySelect(coord);
                e.preventDefault();
            }
            if (e.keyCode === that.keyCodes.right_arrow) {
                let coord = that.getCoord($(this));
                coord[0]++;
                that.trySelect(coord);
                e.preventDefault();
            }
            if (e.keyCode === that.keyCodes.backspace) {
                if ($(this).val() === '') {
                    let coord = that.getCoord($(this));
                    coord[0]--;
                    that.trySelect(coord);
                    e.preventDefault();
                }
            }
        });
        this.$parent.delegate('input', 'click', function (e) {
            let coord = that.getCoord($(this));
            that.trySelect(coord);
        });
    }

    getCoord($e) {
        return $e.data('coord').split(',');
    }

    nextCoord(coord) {
        let [x, y] = coord;
        let currentEntry = this.data[this.entryIndex];
        if (currentEntry.orientation === 'across') {
            if (x >= (currentEntry.startx - 1) + (currentEntry.answer.length - 1)) {
                return this.goToNextWord();
            } else {
                x++;
            }
        } else {
            if (y >= (currentEntry.starty - 1) + (currentEntry.answer.length - 1)) {
                return this.goToNextWord();
            } else {
                y++;
            }
        }
        return [x, y];
    }

    lookupInput(coord) {
        coord = coord.join(',');
        return this.$parent.find(`input[data-coord='${coord}']`)
    }

    lookupUnsolvedInput(coord) {
        let startCoord = coord;
        while (true) {
            let input = this.lookupInput(coord);
            if (!input.attr('disabled')) return input;
            coord = this.nextCoord(coord);
            if (coord.join(',') === startCoord.join(',')) return input;
        }
    }

    goToNextWord() {
        let currentEntry = this.data[this.entryIndex];
        for (let i = 0; i < this.data.length; i++) {
            this.entryIndex++;
            if (this.entryIndex >= this.data.length) this.entryIndex = 0;
            currentEntry = this.data[this.entryIndex];
            if (!currentEntry.solved) break;
        }
        this.highlightEntry();
        return [currentEntry.startx - 1, currentEntry.starty - 1];
    }

    highlightEntry() {
        this.$parent.find('input.active').removeClass('active');
        let entry = this.data[this.entryIndex];
        for (let i in entry.coords) {
            this.lookupInput(entry.coords[i]).addClass('active');
        }

        $('.clue').removeClass('active');
        $(`.clue[data-entry='${this.entryIndex}']`).addClass('active');
    }

    checkSolved() {
        let entry = this.data[this.entryIndex];
        let letters = entry.answer.split('');
        for (let i in entry.coords) {
            let input = this.lookupInput(entry.coords[i]);
            if (input.val() !== letters[i]) return;
        }
        for (let i in entry.coords) {
            let input = this.lookupInput(entry.coords[i]);
            input.addClass('done').attr('disabled', true);
            entry.solved = true;
        }
    }

    setCurrentEntry(coord) {
        let oldOrientation = this.data[this.entryIndex].orientation;
        let [x, y] = coord;
        this.entryIndex = this.grid[y][x][oldOrientation];
        if (this.entryIndex === undefined) {
            let otherOrientation = oldOrientation === 'across' ? 'down' : 'across';
            this.entryIndex = this.grid[y][x][otherOrientation];
        }
    }

    trySelect(coord) {
        let input = this.lookupInput(coord);
        if (input.length && !input.attr('disabled')) {
            input.select();
            this.setCurrentEntry(coord);
            this.highlightEntry();
        }
    }

}