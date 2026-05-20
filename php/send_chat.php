<?php
// ── send_chat.php ─────────────────────────────────────────────
// REQUISITO BD para chat del admin: ALTER TABLE interaccion MODIFY ID_Estudiante INT NULL;
header("Content-Type: application/json");
session_start();
include 'db.php';

if (empty($_SESSION['ID'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "msg" => "No autenticado"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (empty($data['reporte']) || empty($data['mensaje'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "Faltan campos"]);
    exit;
}

$ID_Reporte = (int)$data['reporte'];
$ID_Sesion  = $_SESSION['ID'];
$tipo       = $_SESSION['tipo'];
$mensaje    = trim($data['mensaje']);
$adminID    = 1;

// ── Guardar mensaje ──────────────────────────────────────────
if ($tipo === 'administrador') {
    $stmt = $conn->prepare(
        "INSERT INTO interaccion (ID_Reporte, ID_Estudiante, mensaje) VALUES (?, NULL, ?)"
    );
    $stmt->bind_param("is", $ID_Reporte, $mensaje);
} else {
    $stmt = $conn->prepare(
        "INSERT INTO interaccion (ID_Reporte, ID_Estudiante, mensaje) VALUES (?, ?, ?)"
    );
    $stmt->bind_param("iis", $ID_Reporte, $ID_Sesion, $mensaje);
}

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["status" => "error", "msg" => $stmt->error]);
    $stmt->close(); $conn->close();
    exit;
}
$stmt->close();

// ── Notificar a TODOS los estudiantes (menos quien escribió) ──
// El admin ve todo por ID_Administrador=1, no necesita fila propia → sin NULL
$msgNoti = ($tipo === 'administrador')
    ? "🛡 El administrador respondió en el reporte #$ID_Reporte"
    : "💬 Nueva respuesta en el reporte #$ID_Reporte";

$todos = $conn->query("SELECT ID_Estudiante FROM estudiante");
$stmtN = $conn->prepare(
    "INSERT INTO notificacion (ID_Estudiante, ID_Administrador, ID_Reporte, mensaje)
     VALUES (?, ?, ?, ?)"
);
while ($est = $todos->fetch_assoc()) {
    $estID = $est['ID_Estudiante'];
    if ($tipo === 'estudiante' && $estID == $ID_Sesion) continue;
    $stmtN->bind_param("iiis", $estID, $adminID, $ID_Reporte, $msgNoti);
    $stmtN->execute();
}
$stmtN->close();

echo json_encode(["status" => "ok"]);
$conn->close();
?>