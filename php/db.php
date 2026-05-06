<?php
// ── Conexión a la base de datos ──────────────────────────────
$conn = new mysqli("localhost", "root", "", "sistema_objetos_perdidos");
 
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["status" => "error", "msg" => "Conexión fallida: " . $conn->connect_error]));
}
 
$conn->set_charset("utf8mb4");
?>
 