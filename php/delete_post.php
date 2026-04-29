<?php
header("Content-Type: application/json");

include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "ID requerido"]);
    exit;
}

$stmt = $conn->prepare("DELETE FROM posts WHERE id = ?");
$stmt->bind_param("i", $data['id']);
$stmt->execute();

echo json_encode(["status" => "deleted"]);

$stmt->close();
$conn->close();
?>