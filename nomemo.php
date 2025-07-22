<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No content
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    header('Content-Type: application/javascript');
    echo file_get_contents('nomemo.js');
    exit;
}


$room = preg_replace('/[^a-z0-9_-]/i', '', $_GET['room'] ?? '');
$from = preg_replace('/[^a-z0-9_-]/i', '', $_GET['from'] ?? '');

if (!$room || !$from) {
    http_response_code(400);
    echo "Missing ?room=...&from=...";
    exit;
}

$roomPath = __DIR__ . "/$room";
if (!is_dir($roomPath)) mkdir($roomPath, 0777, true);

// POST = write message
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $text = trim(file_get_contents('php://input'));
    $ts = round(microtime(true) * 1000);

    $filename = "{$ts}_{$from}.txt";
    file_put_contents("$roomPath/$filename", $text);
    http_response_code(204);
    exit;
}

// GET = read & delete all messages not from current user
$messages = [];

foreach (glob("$roomPath/*.txt") as $file) {
    $basename = basename($file, '.txt');
    [$ts, $author] = explode('_', $basename, 2);
    if ($author === $from) continue;

    $msg = file_get_contents($file);
    $messages[] = [
        'from' => $author,
        'msg' => $msg,
        'ts' => (int)$ts
    ];

    unlink($file);
}

// Sorted by microsecond timestamp filename already
header('Content-Type: application/json');
echo json_encode($messages);
