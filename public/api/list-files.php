<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$uploadRoot = '../uploads/';
if (!file_exists($uploadRoot)) {
    mkdir($uploadRoot, 0755, true);
}

$filesList = [];

$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
$basePath = str_replace('\\', '/', dirname($scriptDir));
if ($basePath === '/' || $basePath === '\\') $basePath = '';

$type = isset($_GET['type']) ? $_GET['type'] : 'all';
$allowedTypes = ['all', 'general', 'trainers', 'courses', 'companies'];
if (!in_array($type, $allowedTypes, true)) {
    $type = 'all';
}

function addFilesFromDir($dirPath, $typeLabel, &$filesList, $protocol, $host, $basePath, $pathPrefix) {
    if (!file_exists($dirPath)) {
        return;
    }

    $items = scandir($dirPath);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }

        $filePath = rtrim($dirPath, '/\\') . DIRECTORY_SEPARATOR . $item;
        if (is_file($filePath)) {
            $relPath = ($pathPrefix === '' ? '' : ($pathPrefix . '/')) . $item;
            $filesList[] = [
                "name" => $item,
                "path" => $relPath,
                "type" => $typeLabel,
                "url" => $protocol . "://" . $host . $basePath . '/uploads/' . $relPath,
                "created_at" => date("Y-m-d H:i:s", filemtime($filePath))
            ];
        }
    }
}

if ($type === 'all' || $type === 'general') {
    addFilesFromDir($uploadRoot, 'general', $filesList, $protocol, $host, $basePath, '');
}

if ($type === 'all' || $type === 'trainers') {
    addFilesFromDir($uploadRoot . 'trainers/', 'trainers', $filesList, $protocol, $host, $basePath, 'trainers');
}

if ($type === 'all' || $type === 'courses') {
    addFilesFromDir($uploadRoot . 'courses/', 'courses', $filesList, $protocol, $host, $basePath, 'courses');
}

if ($type === 'all' || $type === 'companies') {
    addFilesFromDir($uploadRoot . 'companies/', 'companies', $filesList, $protocol, $host, $basePath, 'companies');
}

// Sort by date (desc)
usort($filesList, function($a, $b) {
    return strtotime($b['created_at']) - strtotime($a['created_at']);
});

echo json_encode(["success" => true, "files" => $filesList]);
?>
