<?php
// ── update_status.php ─────────────────────────────────────────
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
$ID_Sesion     = $_SESSION['ID'];
$tipo          = $_SESSION['tipo'];
$adminID       = 1;

// Admin puede cambiar cualquier reporte; estudiante solo el suyo
if ($tipo === 'administrador') {
    $check = $conn->prepare("SELECT estado, ID_Estudiante FROM reporte WHERE ID_Reporte = ?");
    $check->bind_param("i", $ID_Reporte);
} else {
    $check = $conn->prepare("SELECT estado, ID_Estudiante FROM reporte WHERE ID_Reporte = ? AND ID_Estudiante = ?");
    $check->bind_param("ii", $ID_Reporte, $ID_Sesion);
}
$check->execute();
$res = $check->get_result();

if ($res->num_rows === 0) {
    http_response_code(403);
    echo json_encode(["status" => "error", "msg" => "No tienes permiso para modificar este reporte"]);
    $check->close(); $conn->close();
    exit;
}

$row     = $res->fetch_assoc();
$current = $row['estado'];
$ownerID = $row['ID_Estudiante'];
$check->close();

$ciclo = ['Perdido' => 'Pendiente', 'Pendiente' => 'Resuelto', 'Resuelto' => 'Perdido'];
$nuevoEstado = $ciclo[$current] ?? 'Perdido';

if (!empty($data['estado']) && in_array($data['estado'], ['Perdido', 'Pendiente', 'Resuelto'])) {
    $nuevoEstado = $data['estado'];
}

$stmt = $conn->prepare("UPDATE reporte SET estado = ? WHERE ID_Reporte = ?");
$stmt->bind_param("si", $nuevoEstado, $ID_Reporte);
$stmt->execute();
$stmt->close();

// ── Notificaciones ────────────────────────────────────────────
$msg = "El reporte #$ID_Reporte fue marcado como: $nuevoEstado";

if ($tipo === 'administrador') {
    // Solo notificar al dueño del reporte
    $stmtN = $conn->prepare(
        "INSERT INTO notificacion (ID_Estudiante, ID_Administrador, ID_Reporte, mensaje)
         VALUES (?, ?, ?, ?)"
    );
    $stmtN->bind_param("iiis", $ownerID, $adminID, $ID_Reporte, $msg);
    $stmtN->execute();
    $stmtN->close();
} else {
    // Estudiante cambió su status → notificar solo al dueño (él mismo) ya lo sabe,
    // pero el admin debe verlo → insertar fila con ownerID para que admin la vea
    $stmtN = $conn->prepare(
        "INSERT INTO notificacion (ID_Estudiante, ID_Administrador, ID_Reporte, mensaje)
         VALUES (?, ?, ?, ?)"
    );
    $stmtN->bind_param("iiis", $ownerID, $adminID, $ID_Reporte, $msg);
    $stmtN->execute();
    $stmtN->close();
}

echo json_encode(["status" => "updated", "nuevoEstado" => $nuevoEstado]);
$conn->close();
?>