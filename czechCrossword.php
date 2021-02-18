<?php
include 'DB.php';
include 'Crossword.php';

// Input difficulty, size?
$difficulty = 0.001;
$count = 20;

$db = new DB();
$maxRank = $db->getMaxRank();
$cw = new Crossword();
echo 'Max Rank: ' . $maxRank . PHP_EOL;
$i = 0;
$tries = 0;
while ($i < $count && $tries < 1000) {
    $rank = rand(1, $maxRank * $difficulty);
    $row = $db->getRowWithRank($rank);
    echo 'Trying: ' . $row['translation'] . PHP_EOL;
    $tries++;
    if ($cw->add($row['translation'])) {
        echo 'Added: ' . $row['translation'] . PHP_EOL;
        $cw->echoGrid();
        $cw->addHint($row['translation'], $row['word']);
        $i++;
    }
}

$cw->echoGrid();

$cw->exportAsJson();

// Open with JavaScript plugin.
// Fix glitches with JavaScript plugin.


