/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.7.2-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: sistema_objetos_perdidos
-- ------------------------------------------------------
-- Server version	11.7.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `administrador`
--

DROP TABLE IF EXISTS `administrador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrador` (
  `ID_Administrador` int(11) NOT NULL AUTO_INCREMENT,
  `noControl` varchar(20) NOT NULL,
  PRIMARY KEY (`ID_Administrador`),
  UNIQUE KEY `noControl` (`noControl`),
  CONSTRAINT `fk_adm_usuario` FOREIGN KEY (`noControl`) REFERENCES `usuario` (`noControl`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administrador`
--

LOCK TABLES `administrador` WRITE;
/*!40000 ALTER TABLE `administrador` DISABLE KEYS */;
/*!40000 ALTER TABLE `administrador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estudiante`
--

DROP TABLE IF EXISTS `estudiante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `estudiante` (
  `ID_Estudiante` int(11) NOT NULL AUTO_INCREMENT,
  `noControl` varchar(20) NOT NULL,
  PRIMARY KEY (`ID_Estudiante`),
  UNIQUE KEY `noControl` (`noControl`),
  CONSTRAINT `fk_est_usuario` FOREIGN KEY (`noControl`) REFERENCES `usuario` (`noControl`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estudiante`
--

LOCK TABLES `estudiante` WRITE;
/*!40000 ALTER TABLE `estudiante` DISABLE KEYS */;
/*!40000 ALTER TABLE `estudiante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `imagen`
--

DROP TABLE IF EXISTS `imagen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `imagen` (
  `idImagen` int(11) NOT NULL AUTO_INCREMENT,
  `ID_Reporte` int(11) NOT NULL,
  `url` varchar(300) NOT NULL,
  PRIMARY KEY (`idImagen`),
  KEY `fk_img_reporte` (`ID_Reporte`),
  CONSTRAINT `fk_img_reporte` FOREIGN KEY (`ID_Reporte`) REFERENCES `reporte` (`ID_Reporte`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `imagen`
--

LOCK TABLES `imagen` WRITE;
/*!40000 ALTER TABLE `imagen` DISABLE KEYS */;
/*!40000 ALTER TABLE `imagen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interaccion`
--

DROP TABLE IF EXISTS `interaccion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `interaccion` (
  `idInteraccion` int(11) NOT NULL AUTO_INCREMENT,
  `ID_Reporte` int(11) NOT NULL,
  `ID_Estudiante` int(11) NOT NULL,
  `mensaje` varchar(500) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`idInteraccion`),
  KEY `fk_int_reporte` (`ID_Reporte`),
  KEY `fk_int_estudiante` (`ID_Estudiante`),
  CONSTRAINT `fk_int_estudiante` FOREIGN KEY (`ID_Estudiante`) REFERENCES `estudiante` (`ID_Estudiante`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_int_reporte` FOREIGN KEY (`ID_Reporte`) REFERENCES `reporte` (`ID_Reporte`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interaccion`
--

LOCK TABLES `interaccion` WRITE;
/*!40000 ALTER TABLE `interaccion` DISABLE KEYS */;
/*!40000 ALTER TABLE `interaccion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacion`
--

DROP TABLE IF EXISTS `notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacion` (
  `ID_Notificacion` int(11) NOT NULL AUTO_INCREMENT,
  `ID_Estudiante` int(11) NOT NULL,
  `ID_Administrador` int(11) NOT NULL,
  `ID_Reporte` int(11) NOT NULL,
  `mensaje` varchar(300) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 = No leída | 1 = Leída',
  PRIMARY KEY (`ID_Notificacion`),
  KEY `fk_noti_estudiante` (`ID_Estudiante`),
  KEY `fk_noti_administrador` (`ID_Administrador`),
  KEY `fk_noti_reporte` (`ID_Reporte`),
  CONSTRAINT `fk_noti_administrador` FOREIGN KEY (`ID_Administrador`) REFERENCES `administrador` (`ID_Administrador`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_noti_estudiante` FOREIGN KEY (`ID_Estudiante`) REFERENCES `estudiante` (`ID_Estudiante`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_noti_reporte` FOREIGN KEY (`ID_Reporte`) REFERENCES `reporte` (`ID_Reporte`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacion`
--

LOCK TABLES `notificacion` WRITE;
/*!40000 ALTER TABLE `notificacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reporte`
--

DROP TABLE IF EXISTS `reporte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reporte` (
  `ID_Reporte` int(11) NOT NULL AUTO_INCREMENT,
  `ID_Estudiante` int(11) NOT NULL,
  `tipoObjeto` varchar(80) NOT NULL,
  `categoria` varchar(80) NOT NULL COMMENT 'Equipo electrónico | Termos | Material académico | Otro',
  `descripcion` varchar(500) NOT NULL,
  `ultimaUbicacion` varchar(200) NOT NULL,
  `fecha` date NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'Perdido' COMMENT 'Perdido | Encontrado | Resuelto',
  PRIMARY KEY (`ID_Reporte`),
  KEY `fk_rep_estudiante` (`ID_Estudiante`),
  CONSTRAINT `fk_rep_estudiante` FOREIGN KEY (`ID_Estudiante`) REFERENCES `estudiante` (`ID_Estudiante`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reporte`
--

LOCK TABLES `reporte` WRITE;
/*!40000 ALTER TABLE `reporte` DISABLE KEYS */;
/*!40000 ALTER TABLE `reporte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `noControl` varchar(20) NOT NULL,
  `tipo` enum('estudiante','administrador') NOT NULL DEFAULT 'estudiante',
  PRIMARY KEY (`id`),
  UNIQUE KEY `noControl` (`noControl`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-05-04 14:01:11
