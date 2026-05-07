<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$type = isset($_POST['type']) ? $_POST['type'] : 'general';
$allowedTypes = ['general', 'trainers', 'courses', 'companies'];
if (!in_array($type, $allowedTypes, true)) {
    $type = 'general';
}

$uploadRoot = '../uploads/';
if (!file_exists($uploadRoot)) {
    mkdir($uploadRoot, 0755, true);
}

$uploadDir = $uploadRoot . ($type === 'general' ? '' : ($type . '/'));
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['file'])) {
        $file = $_FILES['file'];
        $originalName = basename($file['name']);
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf'];

        if (!in_array($ext, $allowedExts, true)) {
            echo json_encode(["success" => false, "message" => "File type not allowed."]);
            exit;
        }

        if (isset($file['size']) && $file['size'] > 10485760) {
            echo json_encode(["success" => false, "message" => "File too large."]);
            exit;
        }

        $safeBase = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
        if ($safeBase === '' || $safeBase === null) {
            $safeBase = 'file';
        }

        $fileName = time() . '_' . $safeBase . '.' . $ext;
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $host = $_SERVER['HTTP_HOST'];
            $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
            $basePath = str_replace('\\', '/', dirname($scriptDir));
            if ($basePath === '/' || $basePath === '\\') $basePath = '';
            $relPath = ($type === 'general' ? '' : ($type . '/')) . $fileName;
            $publicUrl = $protocol . "://" . $host . $basePath . '/uploads/' . $relPath;

            echo json_encode([
                "success" => true,
                "file" => [
                    "name" => $fileName,
                    "path" => $relPath,
                    "type" => $type,
                    "url" => $publicUrl,
                    "created_at" => date('Y-m-d H:i:s')
                ]
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Error moving uploaded file."]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "No file uploaded."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}
?>
