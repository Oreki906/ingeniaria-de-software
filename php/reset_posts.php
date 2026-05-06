<?php
// ── reset_posts.php ───────────────────────────────────────────
// ⚠️  ARCHIVO TEMPORAL — úsalo UNA VEZ y luego ELIMÍNALO.
// Abre en el navegador: http://localhost/tu-proyecto/php/reset_posts.php

include 'db.php';

$conn->query("SET FOREIGN_KEY_CHECKS = 0");
$conn->query("TRUNCATE TABLE notificacion");
$conn->query("TRUNCATE TABLE interaccion");
$conn->query("TRUNCATE TABLE imagen");
$conn->query("TRUNCATE TABLE reporte");
$conn->query("SET FOREIGN_KEY_CHECKS = 1");

echo "✅ Todos los reportes, imágenes, interacciones y notificaciones borrados. IDs reiniciados.";
$conn->close();
?>