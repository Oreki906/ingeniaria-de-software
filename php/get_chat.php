<?php
// ── get_chat.php ──────────────────────────────────────────────
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
            CASE WHEN i.ID_Estudiante IS NULL THEN 1 ELSE 0 END AS es_admin,
            COALESCE(e.noControl, '🛡 Administrador') AS noControl,
            i.mensaje,
            i.fecha
     FROM interaccion i
     LEFT JOIN estudiante e ON i.ID_Estudiante = e.ID_Estudiante
     WHERE i.ID_Reporte = ?
     ORDER BY i.fecha ASC"
);
$stmt->bind_param("i", $ID_Reporte);
$stmt->execute();
$result = $stmt->get_result();

$mensajes = [];
while ($row = $result->fetch_assoc()) {
    $row['es_admin'] = (bool)$row['es_admin'];
    $mensajes[] = $row;
}

echo json_encode($mensajes);
$stmt->close();
$conn->close();
?>