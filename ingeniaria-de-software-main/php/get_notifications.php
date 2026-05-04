<?php
// ── get_notifications.php ─────────────────────────────────────
// GET → devuelve notificaciones del estudiante en sesión
// GET ?marcar=1 → marca todas como leídas y luego las devuelve
header("Content-Type: application/json");
session_start();
include 'db.php';

if (empty($_SESSION['ID']) || $_SESSION['tipo'] !== 'estudiante') {
    http_response_code(401);
    echo json_encode(["status" => "error", "msg" => "No autenticado"]);
    exit;
}

$ID_Estudiante = $_SESSION['ID'];

// Marcar como leídas si se pide
if (isset($_GET['marcar']) && $_GET['marcar'] == 1) {
    $upd = $conn->prepare("UPDATE notificacion SET estado = 1 WHERE ID_Estudiante = ?");
    $upd->bind_param("i", $ID_Estudiante);
    $upd->execute();
    $upd->close();
}

$stmt = $conn->prepare(
    "SELECT n.ID_Notificacion AS id,
            n.mensaje,
            n.fecha,
            n.estado AS leida,
            r.tipoObjeto,
            r.categoria
     FROM notificacion n
     INNER JOIN reporte r ON n.ID_Reporte = r.ID_Reporte
     WHERE n.ID_Estudiante = ?
     ORDER BY n.fecha DESC
     LIMIT 50"
);
$stmt->bind_param("i", $ID_Estudiante);
$stmt->execute();
$result = $stmt->get_result();

$notis = [];
while ($row = $result->fetch_assoc()) {
    $row['leida'] = (bool)$row['leida'];
    $notis[] = $row;
}

echo json_encode($notis);

$stmt->close();
$conn->close();
?>