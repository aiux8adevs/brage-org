<?php
// Progress store for the private learning area (behind the area's password, see ../.htaccess).
// One file per login: each family member has their own user name in the password file, and their progress is kept
// in elevdata/<user>.json. GET returns {user, events}; POST {"events": [...]} adds the ones not seen before (by id)
// and returns {user, added, count}. The guest login "gaest" is answered but never stored.
// Events are only ever added, never changed, so syncing from several computers cannot lose anything.
// The data lives outside public_html (/var/www/brage.org/elevdata/), so deploys never touch it
// and it cannot be fetched as a file.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dir = dirname(__DIR__, 3) . '/elevdata';
// who is logged in (Basic Auth); servers pass it under different names
$user = $_SERVER['REMOTE_USER'] ?? $_SERVER['REDIRECT_REMOTE_USER'] ?? $_SERVER['PHP_AUTH_USER'] ?? '';
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if ($user === '' && stripos($auth, 'basic ') === 0) $user = explode(':', base64_decode(substr($auth, 6)) ?: '', 2)[0];
$user = strtolower(preg_replace('/[^A-Za-z0-9_-]/', '', $user));
if ($user === '' || strlen($user) > 40) { http_response_code(401); exit('{"error":"no user"}'); }
// the shared guest login (for classmates) is never stored: its progress stays in the guest's own browser
const GUEST = 'gaest';
if ($user === GUEST) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') { echo json_encode(['user' => $user, 'guest' => true, 'added' => 0, 'count' => 0]); exit; }
    echo json_encode(['user' => $user, 'guest' => true, 'events' => []]); exit;
}
$file = $dir . '/' . $user . '.json';
const MAX_POST = 1000;          // events in one request
const MAX_FILE = 20000000;      // 20 MB, years of answers

if (!is_dir($dir) && !mkdir($dir, 0700, true)) { http_response_code(500); exit('{"error":"no data folder"}'); }

// one event, checked field by field; anything else is dropped
function clean_event($e) {
    if (!is_array($e)) return null;
    $id = $e['id'] ?? ''; $sub = $e['sub'] ?? ''; $s = $e['s'] ?? ''; $mode = $e['mode'] ?? '';
    if (!is_string($id) || !preg_match('/^[a-z0-9]{6,40}$/', $id)) return null;
    if (!is_string($sub) || !preg_match('/^[a-z0-9-]{1,30}$/', $sub)) return null;
    if (!is_string($s) || !preg_match('/^[a-z0-9-]{1,40}$/', $s)) return null;
    if (!is_string($mode) || !preg_match('/^[a-z0-9-]{0,20}$/', $mode)) return null;
    $t = $e['t'] ?? 0; $lv = $e['lv'] ?? 0; $ms = $e['ms'] ?? 0;
    if (!is_int($t) || $t < 1700000000000 || $t > 4100000000000) return null;
    return ['id' => $id, 't' => $t, 'sub' => $sub, 's' => $s, 'lv' => max(0, min(9, (int)$lv)),
            'ok' => (bool)($e['ok'] ?? false), 'mode' => $mode, 'ms' => max(0, min(36000000, (int)$ms))];
}

$fh = fopen($file, 'c+');
if (!$fh) { http_response_code(500); exit('{"error":"cannot open"}'); }
flock($fh, $_SERVER['REQUEST_METHOD'] === 'POST' ? LOCK_EX : LOCK_SH);
$raw = stream_get_contents($fh);
$data = $raw ? json_decode($raw, true) : null;
$events = is_array($data['events'] ?? null) ? $data['events'] : [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $in = json_decode(file_get_contents('php://input', false, null, 0, 2000000), true);
    $new = is_array($in['events'] ?? null) ? array_slice($in['events'], 0, MAX_POST) : [];
    $seen = array_flip(array_column($events, 'id'));
    $added = 0;
    foreach ($new as $e) {
        $c = clean_event($e);
        if ($c && !isset($seen[$c['id']])) { $events[] = $c; $seen[$c['id']] = true; $added++; }
    }
    $out = json_encode(['events' => $events], JSON_UNESCAPED_UNICODE);
    if (strlen($out) > MAX_FILE) { flock($fh, LOCK_UN); http_response_code(507); exit('{"error":"full"}'); }
    if ($added) { ftruncate($fh, 0); rewind($fh); fwrite($fh, $out); fflush($fh); }
    flock($fh, LOCK_UN);
    echo json_encode(['user' => $user, 'added' => $added, 'count' => count($events)]);
    exit;
}
flock($fh, LOCK_UN);
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); exit('{"error":"method"}'); }
echo json_encode(['user' => $user, 'events' => $events], JSON_UNESCAPED_UNICODE);
