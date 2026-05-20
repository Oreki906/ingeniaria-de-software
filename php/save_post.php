<?php
// ── save_post.php ─────────────────────────────────────────────
header("Content-Type: application/json");
session_start();
include 'db.php';

if (empty($_SESSION['ID'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "msg" => "Debes iniciar sesión para publicar"]);
    exit;
}

// Obtener el ID_Estudiante correcto según el tipo de usuario
if ($_SESSION['tipo'] === 'administrador') {
    // El admin publica a nombre del primer estudiante registrado, o usamos un ID especial.
    // Mejor: obtenemos un ID_Estudiante válido del propio admin si existe en la tabla,
    // o lo marcamos como el estudiante con ID 1 (admin puede publicar igual que cualquiera).
    // Para mantener compatibilidad con la FK, buscamos si el admin tiene fila en estudiante.
    $chkAdmin = $conn->prepare("SELECT ID_Estudiante FROM estudiante WHERE noControl = ?");
    $chkAdmin->bind_param("s", $_SESSION['noControl']);
    $chkAdmin->execute();
    $rowAdmin = $chkAdmin->get_result()->fetch_assoc();
    $chkAdmin->close();

    if (!$rowAdmin) {
        // Insertar al admin como estudiante para cumplir la FK
        $insAdmin = $conn->prepare("INSERT INTO estudiante (noControl) VALUES (?)");
        $insAdmin->bind_param("s", $_SESSION['noControl']);
        $insAdmin->execute();
        $_SESSION['ID_Estudiante_FK'] = $conn->insert_id;
        $insAdmin->close();
    } else {
        $_SESSION['ID_Estudiante_FK'] = $rowAdmin['ID_Estudiante'];
    }
} else {
    $_SESSION['ID_Estudiante_FK'] = $_SESSION['ID'];
}

$raw  = file_get_contents("php://input");
$data = json_decode($raw);

if (!$data) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "No se recibió JSON válido"]);
    exit;
}

if (empty($data->descripcion) || empty($data->ubic) || empty($data->cat)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "Faltan campos obligatorios"]);
    exit;
}

$ID_Estudiante  = $_SESSION['ID_Estudiante_FK'];
$tipoObjeto     = $data->cat;
$categoria      = $data->categoria   ?? $data->cat;
$descripcion    = $data->descripcion;
$ubic           = $data->ubic;
$foto           = $data->foto        ?? "";
$fecha          = $data->fecha       ?? date("Y-m-d");
$estado         = "Perdido";

if (!empty($foto) && strlen($foto) > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "La imagen es demasiado grande (máx 4 MB)"]);
    exit;
}

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

if (!empty($foto)) {
    $stmtImg = $conn->prepare("INSERT INTO imagen (ID_Reporte, url) VALUES (?, ?)");
    $stmtImg->bind_param("is", $ID_Reporte, $foto);
    if (!$stmtImg->execute()) {
        error_log("Error guardando imagen para reporte $ID_Reporte: " . $stmtImg->error);
    }
    $stmtImg->close();
}

// ── Notificar a TODOS los estudiantes ──────────────────────────
// El admin ve TODAS las notificaciones filtrando por ID_Administrador=1
// No se necesita fila extra para el admin → sin NULL
$msg     = "📢 Nueva publicación: $tipoObjeto";
$adminID = 1;

$todos = $conn->query("SELECT ID_Estudiante FROM estudiante");
$stmtN = $conn->prepare(
    "INSERT INTO notificacion (ID_Estudiante, ID_Administrador, ID_Reporte, mensaje)
     VALUES (?, ?, ?, ?)"
);
while ($est = $todos->fetch_assoc()) {
    $estID = $est['ID_Estudiante'];
    $stmtN->bind_param("iiis", $estID, $adminID, $ID_Reporte, $msg);
    $stmtN->execute();
}
$stmtN->close();

echo json_encode(["status" => "ok", "id" => $ID_Reporte]);
$conn->close();
?>