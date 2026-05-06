<?php
// ── delete_post.php ───────────────────────────────────────────
// POST { id: int }
// Estudiante: solo puede borrar sus propios reportes
// Administrador: puede borrar cualquier reporte
header("Content-Type: application/json");
session_start();
include 'db.php';

if (empty($_SESSION['ID'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "msg" => "No autenticado"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "ID requerido"]);
    exit;
}

$ID_Reporte = (int)$data['id'];
$tipo       = $_SESSION['tipo'];
$ID         = $_SESSION['ID'];

if ($tipo === 'administrador') {
    // Admin puede borrar cualquier reporte
    $stmt = $conn->prepare("DELETE FROM reporte WHERE ID_Reporte = ?");
    $stmt->bind_param("i", $ID_Reporte);
} else {
    // Estudiante solo borra los suyos
    $stmt = $conn->prepare("DELETE FROM reporte WHERE ID_Reporte = ? AND ID_Estudiante = ?");
    $stmt->bind_param("ii", $ID_Reporte, $ID);
}

$stmt->execute();

if ($stmt->affected_rows === 0) {
    http_response_code(403);
    echo json_encode(["status" => "error", "msg" => "No se encontró el reporte o no tienes permiso"]);
} else {
    echo json_encode(["status" => "deleted"]);
}

$stmt->close();
$conn->close();
?>