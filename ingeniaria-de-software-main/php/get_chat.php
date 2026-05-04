<?php
// ── get_chat.php ──────────────────────────────────────────────
// GET ?reporte=ID → devuelve los mensajes de chat de ese reporte
header("Content-Type: application/json");
session_start();
include 'db.php';

if (empty($_SESSION['ID'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "msg" => "No autenticado"]);
    exit;
}

if (empty($_GET['reporte'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "ID de reporte requerido"]);
    exit;
}

$ID_Reporte = (int)$_GET['reporte'];

$stmt = $conn->prepare(
    "SELECT i.idInteraccion AS id,
            i.ID_Estudiante,
            e.noControl,
            i.mensaje,
            i.fecha
     FROM interaccion i
     INNER JOIN estudiante e ON i.ID_Estudiante = e.ID_Estudiante
     WHERE i.ID_Reporte = ?
     ORDER BY i.fecha ASC"
);
$stmt->bind_param("i", $ID_Reporte);
$stmt->execute();
$result = $stmt->get_result();

$mensajes = [];
while ($row = $result->fetch_assoc()) {
    $mensajes[] = $row;
}

echo json_encode($mensajes);

$stmt->close();
$conn->close();
?>