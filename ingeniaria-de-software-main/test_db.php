<?php $c = new mysqli("127.0.0.1", "root", "", "sistema_objetos_perdidos"); echo $c->connect_error ? "ERROR: ".$c->connect_error : "CONECTADO OK";
