<?php
// ── save_post.php ─────────────────────────────────────────────
// POST { cat, categoria, descripcion, ubic, foto?, fecha? }
// Requiere sesión de estudiante activa
header("Content-Type: application/json");
session_start();
include 'db.php';

// Validar sesión
if (empty($_SESSION['ID']) || $_SESSION['tipo'] !== 'estudiante') {
    http_response_code(401);
    echo json_encode(["status" => "error", "msg" => "Debes iniciar sesión para publicar"]);
    exit;
}

$raw  = file_get_contents("php://input");
$data = json_decode($raw);

if (!$data) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "No se recibió JSON válido"]);
    exit;
}

// Campos obligatorios
if (empty($data->descripcion) || empty($data->ubic) || empty($data->cat)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "Faltan campos obligatorios (cat, descripcion, ubic)"]);
    exit;
}

$ID_Estudiante  = $_SESSION['ID'];
$tipoObjeto     = $data->cat;
$categoria      = $data->categoria   ?? $data->cat;
$descripcion    = $data->descripcion;
$ubic           = $data->ubic;
$foto           = $data->foto        ?? "";
$fecha          = $data->fecha       ?? date("Y-m-d");
$estado         = "Perdido";

// Insertar reporte
$stmt = $conn->prepare(
    "INSERT INTO reporte (ID_Estudiante, tipoObjeto, categoria, descripcion, ultimaUbicacion, fecha, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?)"
);
$stmt->bind_param("issssss", $ID_Estudiante, $tipoObjeto, $categoria, $descripcion, $ubic, $fecha, $estado);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["status" => "error", "msg" => $stmt->error]);
    $stmt->close(); $conn->close();
    exit;
}

$ID_Reporte = $conn->insert_id;
$stmt->close();

// Guardar imagen si viene
if (!empty($foto)) {
    $stmtImg = $conn->prepare("INSERT INTO imagen (ID_Reporte, url) VALUES (?, ?)");
    $stmtImg->bind_param("is", $ID_Reporte, $foto);
    $stmtImg->execute();
    $stmtImg->close();
}

// Crear notificación automática para el administrador (ID 1 por defecto)
$msg     = "Nueva publicación registrada: $tipoObjeto";
$adminID = 1;
$stmtN = $conn->prepare(
    "INSERT INTO notificacion (ID_Estudiante, ID_Administrador, ID_Reporte, mensaje)
     VALUES (?, ?, ?, ?)"
);
$stmtN->bind_param("iiis", $ID_Estudiante, $adminID, $ID_Reporte, $msg);
$stmtN->execute();
$stmtN->close();

echo json_encode(["status" => "ok", "id" => $ID_Reporte]);

$conn->close();
?>