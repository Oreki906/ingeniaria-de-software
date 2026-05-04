<?php
// ── login.php ────────────────────────────────────────────────
// POST { noControl: "20231001" }
// Responde: { status, tipo, ID, noControl }
header("Content-Type: application/json");
session_start();
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['noControl'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "Número de control requerido"]);
    exit;
}

$noControl = trim($data['noControl']);

// Buscar en la tabla usuario
$stmt = $conn->prepare("SELECT id, tipo FROM usuario WHERE noControl = ?");
$stmt->bind_param("s", $noControl);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["status" => "error", "msg" => "Número de control no encontrado"]);
    $stmt->close(); $conn->close();
    exit;
}

$user = $res->fetch_assoc();
$stmt->close();

// Obtener el ID específico según el tipo
if ($user['tipo'] === 'estudiante') {
    $stmt2 = $conn->prepare("SELECT ID_Estudiante AS ID FROM estudiante WHERE noControl = ?");
} else {
    $stmt2 = $conn->prepare("SELECT ID_Administrador AS ID FROM administrador WHERE noControl = ?");
}
$stmt2->bind_param("s", $noControl);
$stmt2->execute();
$res2 = $stmt2->get_result()->fetch_assoc();
$stmt2->close();

// Guardar sesión
$_SESSION['noControl'] = $noControl;
$_SESSION['tipo']      = $user['tipo'];
$_SESSION['ID']        = $res2['ID'];

echo json_encode([
    "status"    => "ok",
    "tipo"      => $user['tipo'],
    "ID"        => $res2['ID'],
    "noControl" => $noControl
]);

$conn->close();
?>