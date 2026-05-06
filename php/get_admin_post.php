<?php
// ── get_admin_posts.php ───────────────────────────────────────
// GET → devuelve todos los reportes para el panel del administrador
// Requiere sesión de administrador
header("Content-Type: application/json");
session_start();
include 'db.php';

if (empty($_SESSION['ID']) || $_SESSION['tipo'] !== 'administrador') {
    http_response_code(403);
    echo json_encode(["status" => "error", "msg" => "Acceso solo para administradores"]);
    exit;
}

$result = $conn->query(
    "SELECT r.ID_Reporte AS id,
            r.tipoObjeto AS cat,
            r.categoria,
            r.descripcion,
            r.ultimaUbicacion AS ubic,
            r.fecha,
            r.estado,
            e.noControl,
            COALESCE(i.url, '') AS foto
     FROM reporte r
     INNER JOIN estudiante e ON r.ID_Estudiante = e.ID_Estudiante
     LEFT  JOIN imagen     i ON i.ID_Reporte    = r.ID_Reporte
     GROUP BY r.ID_Reporte
     ORDER BY r.ID_Reporte DESC"
);

if (!$result) {
    http_response_code(500);
    echo json_encode(["status" => "error", "msg" => $conn->error]);
    exit;
}

$posts = [];
while ($row = $result->fetch_assoc()) {
    $posts[] = $row;
}

echo json_encode($posts);
$conn->close();
?>