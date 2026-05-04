<?php
// ── register.php ─────────────────────────────────────────────
header("Content-Type: application/json");
include 'db.php';

$data      = json_decode(file_get_contents("php://input"), true);
$noControl = trim($data['noControl'] ?? '');
$tipo      = $data['tipo'] ?? 'estudiante';

if (!$noControl) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "Número de control requerido"]);
    exit;
}

// Verificar que no exista ya
$stmt0 = $conn->prepare("SELECT id FROM usuario WHERE noControl = ?");
$stmt0->bind_param("s", $noControl);
$stmt0->execute();
if ($stmt0->get_result()->num_rows > 0) {
    http_response_code(409);
    echo json_encode(["status" => "error", "msg" => "Ya existe ese número de control"]);
    $stmt0->close(); $conn->close();
    exit;
}
$stmt0->close();

// Insertar en usuario
$stmt = $conn->prepare("INSERT INTO usuario (noControl, tipo) VALUES (?, ?)");
$stmt->bind_param("ss", $noControl, $tipo);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["status" => "error", "msg" => $stmt->error]);
    $stmt->close(); $conn->close();
    exit;
}
$stmt->close();

// Insertar en tabla correspondiente
if ($tipo === 'estudiante') {
    $stmt2 = $conn->prepare("INSERT INTO estudiante (noControl) VALUES (?)");
} else {
    $stmt2 = $conn->prepare("INSERT INTO administrador (noControl) VALUES (?)");
}
$stmt2->bind_param("s", $noControl);
if (!$stmt2->execute()) {
    http_response_code(500);
    echo json_encode(["status" => "error", "msg" => $stmt2->error]);
    $stmt2->close(); $conn->close();
    exit;
}
$stmt2->close();

echo json_encode(["status" => "ok"]);
$conn->close();
?>