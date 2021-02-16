<?php
include 'DB.php';
include 'Crossword.php';

// Input difficulty, size?
$difficulty = 0.001;
$count = 10;

$db = new DB();
$maxRank = $db->getMaxRank();
$cw = new Crossword();
echo 'Max Rank: ' . $maxRank . PHP_EOL;
$i = 0;
while ($i < $count) {
    $rank = rand(1, $maxRank * $difficulty);
    $row = $db->getRowWithRank($rank);
    echo 'Trying: ' . $row['word'] . PHP_EOL;
    if ($cw->add($row['word'])) {
        echo 'Added: ' . $row['word'] . PHP_EOL;
        $cw->echoGrid();
        $cw->addHint($row['word'], $db->getTranslation($row['word']));
        $i++;
    }
}

$cw->echoGrid();

$cw->exportAsJson();

// Open with JavaScript plugin.
// Fix glitches with JavaScript plugin.


