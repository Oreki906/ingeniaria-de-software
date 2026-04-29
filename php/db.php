<?php
$conn = new mysqli("localhost", "root", "", "objetos_perdidos");

if ($conn->connect_error) {
    die("Error: " . $conn->connect_error);
}
?>