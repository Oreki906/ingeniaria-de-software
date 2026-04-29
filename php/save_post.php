<?php
header("Content-Type: application/json");

include 'db.php';

// Leer el JSON que manda el frontend
$raw  = file_get_contents("php://input");
$data = json_decode($raw);

// Validar que llegó algo
if (!$data) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "No se recibió JSON válido"]);
    exit;
}

// Validar que los campos obligatorios existen y no están vacíos
if (empty($data->descripcion) || empty($data->ubic) || empty($data->cat)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "Faltan campos obligatorios"]);
    exit;
}

// Prepared statement — forma segura, igual que delete y update
$stmt = $conn->prepare(
    "INSERT INTO posts (cat, estado, descripcion, ubic, foto, fecha, resuelto)
     VALUES (?, ?, ?, ?, ?, ?, ?)"
);

// Extraer valores del JSON recibido
$cat         = $data->cat;
$estado      = $data->estado      ?? "perdido";
$descripcion = $data->descripcion;
$ubic        = $data->ubic;
$foto        = $data->foto        ?? "";
$fecha       = $data->fecha       ?? date("d/m/Y");
$resuelto    = (int)($data->resuelto ?? 0);

// "ssssssi" = tipo de cada parámetro: s=string, i=integer
$stmt->bind_param("ssssssi", $cat, $estado, $descripcion, $ubic, $foto, $fecha, $resuelto);

if ($stmt->execute()) {
    echo json_encode(["status" => "ok", "id" => $conn->insert_id]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "msg" => $conn->error]);
}

$stmt->close();
$conn->close();
?>