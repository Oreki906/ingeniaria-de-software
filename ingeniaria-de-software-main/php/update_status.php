<?php
// ── update_status.php ─────────────────────────────────────────
// POST { id: int }
// Marca el reporte como Resuelto / Perdido (toggle)
// Solo el estudiante dueño del reporte puede hacerlo
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

$ID_Reporte    = (int)$data['id'];
$ID_Estudiante = $_SESSION['ID'];

// Verificar que el reporte pertenece al estudiante en sesión
$check = $conn->prepare("SELECT estado FROM reporte WHERE ID_Reporte = ? AND ID_Estudiante = ?");
$check->bind_param("ii", $ID_Reporte, $ID_Estudiante);
$check->execute();
$res = $check->get_result();

if ($res->num_rows === 0) {
    http_response_code(403);
    echo json_encode(["status" => "error", "msg" => "No tienes permiso para modificar este reporte"]);
    $check->close(); $conn->close();
    exit;
}

$current = $res->fetch_assoc()['estado'];
$check->close();

// Toggle: Perdido ↔ Resuelto
$nuevoEstado = ($current === 'Resuelto') ? 'Perdido' : 'Resuelto';

$stmt = $conn->prepare("UPDATE reporte SET estado = ? WHERE ID_Reporte = ?");
$stmt->bind_param("si", $nuevoEstado, $ID_Reporte);
$stmt->execute();
$stmt->close();

// Notificar al administrador del cambio
$msg     = "El reporte #$ID_Reporte fue marcado como: $nuevoEstado";
$adminID = 1;
$stmtN = $conn->prepare(
    "INSERT INTO notificacion (ID_Estudiante, ID_Administrador, ID_Reporte, mensaje)
     VALUES (?, ?, ?, ?)"
);
$stmtN->bind_param("iiis", $ID_Estudiante, $adminID, $ID_Reporte, $msg);
$stmtN->execute();
$stmtN->close();

echo json_encode(["status" => "updated", "nuevoEstado" => $nuevoEstado]);

$conn->close();
?>