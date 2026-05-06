<?php
// ── send_chat.php ─────────────────────────────────────────────
// POST { reporte: int, mensaje: string }
// Guarda el mensaje y notifica al dueño del reporte
header("Content-Type: application/json");
session_start();
include 'db.php';

if (empty($_SESSION['ID']) || $_SESSION['tipo'] !== 'estudiante') {
    http_response_code(401);
    echo json_encode(["status" => "error", "msg" => "No autenticado"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['reporte']) || empty($data['mensaje'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "Faltan campos: reporte, mensaje"]);
    exit;
}

$ID_Reporte    = (int)$data['reporte'];
$ID_Estudiante = $_SESSION['ID'];
$mensaje       = trim($data['mensaje']);

// Guardar interacción
$stmt = $conn->prepare(
    "INSERT INTO interaccion (ID_Reporte, ID_Estudiante, mensaje) VALUES (?, ?, ?)"
);
$stmt->bind_param("iis", $ID_Reporte, $ID_Estudiante, $mensaje);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["status" => "error", "msg" => $stmt->error]);
    $stmt->close(); $conn->close();
    exit;
}
$stmt->close();

// Notificar al dueño del reporte (si no es el mismo que escribe)
$owner = $conn->prepare("SELECT ID_Estudiante FROM reporte WHERE ID_Reporte = ?");
$owner->bind_param("i", $ID_Reporte);
$owner->execute();
$ownerRow = $owner->get_result()->fetch_assoc();
$owner->close();

if ($ownerRow && $ownerRow['ID_Estudiante'] != $ID_Estudiante) {
    $dueno   = $ownerRow['ID_Estudiante'];
    $adminID = 1;
    $msgNoti = "Respondieron a tu publicación #$ID_Reporte";

    $stmtN = $conn->prepare(
        "INSERT INTO notificacion (ID_Estudiante, ID_Administrador, ID_Reporte, mensaje)
         VALUES (?, ?, ?, ?)"
    );
    $stmtN->bind_param("iiis", $dueno, $adminID, $ID_Reporte, $msgNoti);
    $stmtN->execute();
    $stmtN->close();
}

echo json_encode(["status" => "ok"]);

$conn->close();
?>