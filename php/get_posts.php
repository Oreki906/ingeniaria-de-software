<?php
header("Content-Type: application/json");

include 'db.php';

$result = $conn->query("SELECT * FROM posts ORDER BY id DESC");

// Verificar que la query funcionó
if (!$result) {
    http_response_code(500);
    echo json_encode(["status" => "error", "msg" => $conn->error]);
    exit;
}

$posts = [];
while ($row = $result->fetch_assoc()) {
    $posts[] = $row;
}

echo json_encode($posts);

$conn->close();
?>