<?php
// ── login.php ────────────────────────────────────────────────
header("Content-Type: application/json");
session_start();
include 'db.php';

$data      = json_decode(file_get_contents("php://input"), true);
$noControl = trim($data['noControl'] ?? '');
$password  = $data['password']  ?? '';
$esAdmin   = $data['esAdmin']   ?? false;

if (!$noControl) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "Número de control requerido"]);
    exit;
}

// Buscar en usuario
$stmt = $conn->prepare("SELECT id, tipo FROM usuario WHERE noControl = ?");
$stmt->bind_param("s", $noControl);
$stmt->execute();
$res  = $stmt->get_result();

if ($res->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["status" => "error", "msg" => "Número de control no encontrado"]);
    $stmt->close(); $conn->close();
    exit;
}

$user = $res->fetch_assoc();
$stmt->close();

// ── LOGIN ADMIN ──────────────────────────────────────────────
if ($esAdmin) {
    if ($user['tipo'] !== 'administrador') {
        http_response_code(403);
        echo json_encode(["status" => "error", "msg" => "Este número de control no es administrador"]);
        $conn->close(); exit;
    }

    $stmt2 = $conn->prepare("SELECT ID_Administrador AS ID FROM administrador WHERE noControl = ? AND password = MD5(?)");
    $stmt2->bind_param("ss", $noControl, $password);
    $stmt2->execute();
    $res2 = $stmt2->get_result();

    if ($res2->num_rows === 0) {
        http_response_code(401);
        echo json_encode(["status" => "error", "msg" => "Contraseña incorrecta"]);
        $stmt2->close(); $conn->close(); exit;
    }

    $row = $res2->fetch_assoc();
    $stmt2->close();

    $_SESSION['noControl'] = $noControl;
    $_SESSION['tipo']      = 'administrador';
    $_SESSION['ID']        = $row['ID'];

    echo json_encode(["status" => "ok", "tipo" => "administrador", "ID" => $row['ID'], "noControl" => $noControl]);
    $conn->close(); exit;
}

// ── LOGIN ESTUDIANTE ─────────────────────────────────────────
if ($user['tipo'] === 'administrador') {
    http_response_code(403);
    echo json_encode(["status" => "error", "msg" => "Usa la opción de administrador para entrar"]);
    $conn->close(); exit;
}

$stmt3 = $conn->prepare("SELECT ID_Estudiante AS ID FROM estudiante WHERE noControl = ?");
$stmt3->bind_param("s", $noControl);
$stmt3->execute();
$res3 = $stmt3->get_result()->fetch_assoc();
$stmt3->close();

$_SESSION['noControl'] = $noControl;
$_SESSION['tipo']      = 'estudiante';
$_SESSION['ID']        = $res3['ID'];

echo json_encode(["status" => "ok", "tipo" => "estudiante", "ID" => $res3['ID'], "noControl" => $noControl]);
$conn->close();
?>