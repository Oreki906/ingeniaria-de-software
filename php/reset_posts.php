<?php
// ⚠️  ARCHIVO TEMPORAL - BORRA TODOS LOS POSTS
// Abre este archivo UNA VEZ en el navegador: http://localhost/tu-proyecto/php/reset_posts.php
// Luego ELIMÍNALO del servidor para evitar borrados accidentales.

include 'db.php';

$conn->query("DELETE FROM posts");
$conn->query("ALTER TABLE posts AUTO_INCREMENT = 1");

echo "✅ Todos los registros borrados y el contador de IDs reiniciado.";
$conn->close();
?>
