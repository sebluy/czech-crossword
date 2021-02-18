<?php

class DB
{

    private $db;

    public function __construct()
    {
        $this->db = new SQLite3('word.db');
    }

    private function queryScalar($sql, $params = [])
    {
        $result = array_values($this->queryRow($sql, $params));
        return isset($result[0]) ? $result[0] : null;
    }

    private function queryRow($sql, $params = [])
    {
        $stmt = $this->db->prepare($sql);
        foreach ($params as $i => $param) {
            $stmt->bindValue($i + 1, $param);
        }
        return $stmt->execute()->fetchArray(SQLITE3_ASSOC);
    }

    public function getMaxRank()
    {
        return $this->queryScalar('SELECT MAX(id) FROM words');
    }

    public function getRowWithRank($rank)
    {
        $row = $this->queryRow('SELECT * FROM words WHERE id = ?', [$rank]);
        $row['word'] = mb_strtolower($row['word']);
        $row['translation'] = $this->getTranslation(mb_strtolower($row['word']));
        return $row;
    }

    public function getTranslation($word)
    {
        $translation = $this->queryScalar('SELECT translation FROM words WHERE word = ?', [$word]);
        if (is_null($translation)) {
            $translation = $this->fetchTranslation($word);
            $this->updateTranslation($word, $translation);
        }
        return $translation;
    }

    private function fetchTranslation($line)
    {
        echo 'Fetching: ' . $line . PHP_EOL;
        sleep(11);
        $url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=cs&tl=en&dt=t&q=' . urlencode($line);
        $contents = json_decode(file_get_contents($url));
        if (is_null($contents)) {
            var_dump($http_response_header);
            throw new Exception('Too many requests');
        }
        return mb_strtolower($contents[0][0][0]);
    }

    private function updateTranslation($word, $translation)
    {
        $stmt = $this->db->prepare('UPDATE words SET translation = ? WHERE word = ?');
        $params = [$translation, $word];
        foreach ($params as $i => $param) {
            $stmt->bindValue($i + 1, $param);
        }
        return $stmt->execute();
    }

}
