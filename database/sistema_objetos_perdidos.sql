-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 07, 2026 at 11:34 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sistema_objetos_perdidos`
--

-- --------------------------------------------------------

--
-- Table structure for table `administrador`
--

CREATE TABLE `administrador` (
  `ID_Administrador` int(11) NOT NULL,
  `noControl` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `administrador`
--

INSERT INTO `administrador` (`ID_Administrador`, `noControl`, `password`) VALUES
(1, '20231002', '0192023a7bbd73250516f069df18b500');

-- --------------------------------------------------------

--
-- Table structure for table `estudiante`
--

CREATE TABLE `estudiante` (
  `ID_Estudiante` int(11) NOT NULL,
  `noControl` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `estudiante`
--

INSERT INTO `estudiante` (`ID_Estudiante`, `noControl`) VALUES
(1, '20231001'),
(2, '23760335');

-- --------------------------------------------------------

--
-- Table structure for table `imagen`
--

CREATE TABLE `imagen` (
  `idImagen` int(11) NOT NULL,
  `ID_Reporte` int(11) NOT NULL,
  `url` varchar(300) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interaccion`
--

CREATE TABLE `interaccion` (
  `idInteraccion` int(11) NOT NULL,
  `ID_Reporte` int(11) NOT NULL,
  `ID_Estudiante` int(11) NOT NULL,
  `mensaje` varchar(500) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interaccion`
--

INSERT INTO `interaccion` (`idInteraccion`, `ID_Reporte`, `ID_Estudiante`, `mensaje`, `fecha`) VALUES
(4, 3, 1, 'yo', '2026-05-06 12:22:03'),
(5, 3, 2, 'tuq', '2026-05-06 12:22:15');

-- --------------------------------------------------------

--
-- Table structure for table `notificacion`
--

CREATE TABLE `notificacion` (
  `ID_Notificacion` int(11) NOT NULL,
  `ID_Estudiante` int(11) NOT NULL,
  `ID_Administrador` int(11) NOT NULL,
  `ID_Reporte` int(11) NOT NULL,
  `mensaje` varchar(300) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 = No leída | 1 = Leída'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notificacion`
--

INSERT INTO `notificacion` (`ID_Notificacion`, `ID_Estudiante`, `ID_Administrador`, `ID_Reporte`, `mensaje`, `fecha`, `estado`) VALUES
(1, 2, 1, 1, 'Nueva publicación registrada: Termos', '2026-05-04 14:51:57', 1),
(3, 2, 1, 1, 'Respondieron a tu publicación #1', '2026-05-06 11:38:09', 0),
(4, 2, 1, 1, 'Respondieron a tu publicación #1', '2026-05-06 11:39:06', 0),
(5, 2, 1, 1, 'El reporte #1 fue marcado como: Resuelto', '2026-05-06 12:00:29', 0),
(6, 2, 1, 3, 'Nueva publicación registrada: Termos', '2026-05-06 12:02:17', 0),
(7, 2, 1, 3, 'Respondieron a tu publicación #3', '2026-05-06 12:22:03', 0);

-- --------------------------------------------------------

--
-- Table structure for table `reporte`
--

CREATE TABLE `reporte` (
  `ID_Reporte` int(11) NOT NULL,
  `ID_Estudiante` int(11) NOT NULL,
  `tipoObjeto` varchar(80) NOT NULL,
  `categoria` varchar(80) NOT NULL COMMENT 'Equipo electrónico | Termos | Material académico | Otro',
  `descripcion` varchar(500) NOT NULL,
  `ultimaUbicacion` varchar(200) NOT NULL,
  `fecha` date NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'Perdido' COMMENT 'Perdido | Encontrado | Resuelto'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reporte`
--

INSERT INTO `reporte` (`ID_Reporte`, `ID_Estudiante`, `tipoObjeto`, `categoria`, `descripcion`, `ultimaUbicacion`, `fecha`, `estado`) VALUES
(1, 2, 'Termos', 'Termos', 'termo color negro transparente marca tupperware de 2 litros', 'salon 206', '2026-05-04', 'Resuelto'),
(3, 2, 'Termos', 'Termos', 'stanley rosa de 1.5lt', 'edificio 300', '2026-05-06', 'Perdido');

-- --------------------------------------------------------

--
-- Table structure for table `usuario`
--

CREATE TABLE `usuario` (
  `id` int(11) NOT NULL,
  `noControl` varchar(20) NOT NULL,
  `tipo` enum('estudiante','administrador') NOT NULL DEFAULT 'estudiante'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `usuario`
--

INSERT INTO `usuario` (`id`, `noControl`, `tipo`) VALUES
(1, '20231001', 'estudiante'),
(2, '20231002', 'administrador'),
(3, '23760335', 'estudiante');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `administrador`
--
ALTER TABLE `administrador`
  ADD PRIMARY KEY (`ID_Administrador`),
  ADD UNIQUE KEY `noControl` (`noControl`);

--
-- Indexes for table `estudiante`
--
ALTER TABLE `estudiante`
  ADD PRIMARY KEY (`ID_Estudiante`),
  ADD UNIQUE KEY `noControl` (`noControl`);

--
-- Indexes for table `imagen`
--
ALTER TABLE `imagen`
  ADD PRIMARY KEY (`idImagen`),
  ADD KEY `fk_img_reporte` (`ID_Reporte`);

--
-- Indexes for table `interaccion`
--
ALTER TABLE `interaccion`
  ADD PRIMARY KEY (`idInteraccion`),
  ADD KEY `fk_int_reporte` (`ID_Reporte`),
  ADD KEY `fk_int_estudiante` (`ID_Estudiante`);

--
-- Indexes for table `notificacion`
--
ALTER TABLE `notificacion`
  ADD PRIMARY KEY (`ID_Notificacion`),
  ADD KEY `fk_noti_estudiante` (`ID_Estudiante`),
  ADD KEY `fk_noti_administrador` (`ID_Administrador`),
  ADD KEY `fk_noti_reporte` (`ID_Reporte`);

--
-- Indexes for table `reporte`
--
ALTER TABLE `reporte`
  ADD PRIMARY KEY (`ID_Reporte`),
  ADD KEY `fk_rep_estudiante` (`ID_Estudiante`);

--
-- Indexes for table `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `noControl` (`noControl`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `administrador`
--
ALTER TABLE `administrador`
  MODIFY `ID_Administrador` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `estudiante`
--
ALTER TABLE `estudiante`
  MODIFY `ID_Estudiante` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `imagen`
--
ALTER TABLE `imagen`
  MODIFY `idImagen` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `interaccion`
--
ALTER TABLE `interaccion`
  MODIFY `idInteraccion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `notificacion`
--
ALTER TABLE `notificacion`
  MODIFY `ID_Notificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `reporte`
--
ALTER TABLE `reporte`
  MODIFY `ID_Reporte` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `administrador`
--
ALTER TABLE `administrador`
  ADD CONSTRAINT `fk_adm_usuario` FOREIGN KEY (`noControl`) REFERENCES `usuario` (`noControl`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `estudiante`
--
ALTER TABLE `estudiante`
  ADD CONSTRAINT `fk_est_usuario` FOREIGN KEY (`noControl`) REFERENCES `usuario` (`noControl`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `imagen`
--
ALTER TABLE `imagen`
  ADD CONSTRAINT `fk_img_reporte` FOREIGN KEY (`ID_Reporte`) REFERENCES `reporte` (`ID_Reporte`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `interaccion`
--
ALTER TABLE `interaccion`
  ADD CONSTRAINT `fk_int_estudiante` FOREIGN KEY (`ID_Estudiante`) REFERENCES `estudiante` (`ID_Estudiante`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_int_reporte` FOREIGN KEY (`ID_Reporte`) REFERENCES `reporte` (`ID_Reporte`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notificacion`
--
ALTER TABLE `notificacion`
  ADD CONSTRAINT `fk_noti_administrador` FOREIGN KEY (`ID_Administrador`) REFERENCES `administrador` (`ID_Administrador`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_noti_estudiante` FOREIGN KEY (`ID_Estudiante`) REFERENCES `estudiante` (`ID_Estudiante`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_noti_reporte` FOREIGN KEY (`ID_Reporte`) REFERENCES `reporte` (`ID_Reporte`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reporte`
--
ALTER TABLE `reporte`
  ADD CONSTRAINT `fk_rep_estudiante` FOREIGN KEY (`ID_Estudiante`) REFERENCES `estudiante` (`ID_Estudiante`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
