<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$uploadRoot = '../uploads/';
if (!file_exists($uploadRoot)) {
    mkdir($uploadRoot, 0755, true);
}

function isSafeRelativePath($path) {
    if ($path === null || $path === '') {
        return false;
    }
    if (strpos($path, '..') !== false) {
        return false;
    }
    if (substr($path, 0, 1) === '/' || substr($path, 0, 1) === '\\') {
        return false;
    }
    return true;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $path = null;
    if (isset($input['path'])) {
        $path = $input['path'];
    } elseif (isset($input['fileName'])) {
        $path = basename($input['fileName']);
    }

    if ($path !== null && isSafeRelativePath($path)) {
        $uploadReal = realpath($uploadRoot);
        $filePath = $uploadRoot . str_replace(['\\'], ['/' ], $path);
        $fileReal = realpath($filePath);

        if ($uploadReal === false || $fileReal === false || strpos($fileReal, $uploadReal) !== 0) {
            echo json_encode(["success" => false, "message" => "Invalid file path."]);
            exit;
        }

        if (file_exists($fileReal)) {
            if (unlink($fileReal)) {
                echo json_encode(["success" => true, "message" => "File deleted."]);
            } else {
                echo json_encode(["success" => false, "message" => "Error deleting file."]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "File not found."]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "No file path provided."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}
?>
