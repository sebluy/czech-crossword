<?php

class Crossword
{

    private $words;
    private $hints;
    private $grid;

    public function __construct()
    {
        $this->words = [];
        $this->hints = [];
        $this->grid = array_fill(0, 16, array_fill(0, 16, null));
    }

    public function add($word)
    {
        if (mb_strlen($word) === 1) return false;
        if (empty($this->words)) {
            $this->tryToPlaceWordExact($word, [0, 0, 0]);
            return true;
        }
        foreach (mb_str_split($word) as $char) {
            $positions = $this->getFreeLetters($char);
            foreach ($positions as $position) {
                $placed = $this->tryToPlaceWord($word, $position);
                if ($placed) return true;
            }
        }
        return false;
    }

    public function addHint($word, $hint)
    {
        $this->words[$word]['clue'] = $hint;
    }

    public function exportAsJson()
    {
        $json = json_encode(array_values($this->words));
        $js = <<<JS
$(function () {
	$('#puzzle-wrapper').crossword({$json});
});
JS;
        file_put_contents('js/my-crossword.js', $js);
    }

    private function mb_strpos_all($haystack, $needle)
    {
        $pos = 0;
        $allPos = [];
        while (true) {
            $pos = mb_strpos($haystack, $needle, $pos);
            if ($pos === false) break;
            $allPos[] = $pos;
            $pos++;
        }
        return $allPos;
    }

    private function tryToPlaceWord($word, $position)
    {
        list($x, $y, $dir) = $position;
        $char = $this->getGrid($x, $y);
        $offsets = $this->mb_strpos_all($word, $char);

        foreach ($offsets as $offset) {
            $newX = $x - ($dir ? 0 : $offset);
            $newY = $y - ($dir ? $offset : 0);
            $result = $this->tryToPlaceWordExact($word, [$newX, $newY, $dir]);
            if ($result) return true;
        }
        return false;
    }

    private function checkSpace($word, $position)
    {
        list($x, $y, $dir) = $position;
        echo "Checking: {$word} at ({$x}, {$y}, {$dir})" . PHP_EOL;

        $new = false;
        $chars = mb_str_split($word);
        foreach ($chars as $i => $char) {
            if ($x < 0 || $x >= 16 || $y < 0 || $y >= 16) return false;
            $existing = $this->getGrid($x, $y);
            if (!is_null($existing) && $existing !== $char) return false;

            if ($existing !== $char) {
                $new = true;
                $first = $i === 0;
                $last = $i === count($chars) - 1;
                if ($dir) {
                    if ($first && $this->isSet($x, $y - 1)) return false;
                    if ($last && $this->isSet($x, $y + 1)) return false;
                    if ($this->isSet($x, $y - 1) && $this->isSet($x, $y - 2)) return false;
                    if ($this->isSet($x, $y + 1) && $this->isSet($x, $y + 2)) return false;
                    if ($this->isSet($x + 1, $y)) return false;
                    if ($this->isSet($x - 1, $y)) return false;
                } else {
                    if ($first && $this->isSet($x - 1, $y)) return false;
                    if ($last && $this->isSet($x + 1, $y)) return false;
                    if ($this->isSet($x - 1, $y) && $this->isSet($x - 2, $y)) return false;
                    if ($this->isSet($x + 1, $y) && $this->isSet($x + 2, $y)) return false;
                    if ($this->isSet($x, $y + 1)) return false;
                    if ($this->isSet($x, $y - 1)) return false;
                }
            }
            if ($dir) $y++;
            else $x++;
        }
        return $new;
    }

    private function tryToPlaceWordExact($word, $position)
    {
        if (!$this->checkSpace($word, $position)) return false;

        list($x, $y, $dir) = $position;
        foreach (mb_str_split($word) as $char) {
            $this->setGrid($x, $y, $char);
            if ($dir) $y++;
            else $x++;
        }
        list($x, $y, $dir) = $position;
        $this->words[$word] = [
            'clue' => '<Placeholder>',
            'answer' => $word,
            'position' => 1,
            'orientation' => $dir ? 'down' : 'across',
            'startx' => $x + 1,
            'starty' => $y + 1,
        ];
        return true;
    }

    public function echoGrid()
    {
        for ($y = 0; $y < 16; $y++) {
            for ($x = 0; $x < 16; $x++) {
                echo isset($this->grid[$y][$x]) ? $this->grid[$y][$x] : ' ';
            }
            echo PHP_EOL;
        }
    }

    private function getFreeLetters($char)
    {
        $free = [];
        for ($y = 0; $y < 16; $y++) {
            for ($x = 0; $x < 16; $x++) {
                if ($this->getGrid($x, $y) === $char) {
                    $dirs = $this->checkFreeDirs([$x, $y]);
                    foreach ($dirs as $dir) {
                        $free[] = [$x, $y, $dir];
                    }
                }
            }
        }
        return $free;
    }

    private function checkFreeDirs($pos)
    {
        list($x, $y) = $pos;
        $dirs = [];
        if (!$this->isSet($x + 1, $y)) $dirs[] = 0;
        if (!$this->isSet($x - 1, $y)) $dirs[] = 0;
        if (!$this->isSet($x, $y - 1)) $dirs[] = 1;
        if (!$this->isSet($x, $y + 1)) $dirs[] = 1;
        return array_unique($dirs);
    }

    private function getGrid($x, $y)
    {
        if (isset($this->grid[$y][$x])) return $this->grid[$y][$x];
        return null;
    }

    private function isSet($x, $y)
    {
        return isset($this->grid[$y][$x]);
    }

    private function setGrid($x, $y, $value)
    {
        if ($x < 0 || $x >= 16) return false;
        if ($y < 0 || $y >= 16) return false;
        if ($this->isSet($x, $y)) return false;
        $this->grid[$y][$x] = $value;
        return true;
    }

}
