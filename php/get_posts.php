<?php
// ── get_posts.php ────────────────────────────────────────────
// GET  → devuelve todos los reportes activos (tablón público)
// GET ?mis=1  → devuelve solo los reportes del estudiante en sesión
header("Content-Type: application/json");
session_start();
include 'db.php';

$soloMios = isset($_GET['mis']) && $_GET['mis'] == 1;

if ($soloMios) {
    // Validar sesión
    if (empty($_SESSION['ID']) || $_SESSION['tipo'] !== 'estudiante') {
        http_response_code(401);
        echo json_encode(["status" => "error", "msg" => "No autenticado"]);
        exit;
    }

    $id = $_SESSION['ID'];
    $stmt = $conn->prepare(
        "SELECT r.ID_Reporte AS id,
                r.ID_Estudiante,
                r.tipoObjeto AS cat,
                r.categoria,
                r.descripcion,
                r.ultimaUbicacion AS ubic,
                r.fecha,
                r.estado,
                COALESCE(i.url, '') AS foto,
                (r.estado = 'Resuelto') AS resuelto
         FROM reporte r
         LEFT JOIN imagen i ON i.ID_Reporte = r.ID_Reporte
         WHERE r.ID_Estudiante = ?
         GROUP BY r.ID_Reporte
         ORDER BY r.ID_Reporte DESC"
    );
    $stmt->bind_param("i", $id);
} else {
    // Tablón público: todos menos resueltos
    $stmt = $conn->prepare(
        "SELECT r.ID_Reporte AS id,
                r.ID_Estudiante,
                r.tipoObjeto AS cat,
                r.categoria,
                r.descripcion,
                r.ultimaUbicacion AS ubic,
                r.fecha,
                r.estado,
                COALESCE(i.url, '') AS foto,
                (r.estado = 'Resuelto') AS resuelto
         FROM reporte r
         LEFT JOIN imagen i ON i.ID_Reporte = r.ID_Reporte
         WHERE r.estado != 'Resuelto'
         GROUP BY r.ID_Reporte
         ORDER BY r.ID_Reporte DESC"
    );
}

$stmt->execute();
$result = $stmt->get_result();

if (!$result) {
    http_response_code(500);
    echo json_encode(["status" => "error", "msg" => $conn->error]);
    exit;
}

$posts = [];
while ($row = $result->fetch_assoc()) {
    $row['resuelto'] = (bool)$row['resuelto'];
    $posts[] = $row;
}

echo json_encode($posts);

$stmt->close();
$conn->close();
?>