-- DB_HOST=127.0.0.1
-- DB_PORT=3306
-- DB_DATABASE=jsonstory
-- DB_USERNAME=jsonstory
-- DB_PASSWORD=jsonstory
--
-- drop database
    DROP DATABASE IF EXISTS jsonstory;

    -- Bug #19166  DROP USER IF EXISTS
    -- http://bugs.mysql.com/bug.php?id=19166
    -- > A good workaround is to grant a harmless privilege to the
    -- > user before dropping it. This will create the user if it
    -- > doesn't exist, so that it can be dropped safely

    -- 10.1.5. Configuring the Character Set and Collation for Applications
    -- http://dev.mysql.com/doc/refman/5.1/en/charset-applications.html
    -- > Specify character settings per database. To create a
    -- > database such that its tables will use a given default
    -- > character set and collation for data storage, use a CREATE
    -- > DATABASE statement like this:
    -- >
    -- >    CREATE DATABASE mydb
    -- >        DEFAULT CHARACTER SET utf8
    -- >        DEFAULT COLLATE utf8_general_ci;
    -- >
    -- > Tables created in the database will use utf8 and
    -- > utf8_general_ci by default for any character columns.

-- create database
    CREATE DATABASE jsonstory
        DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;

-- create user
    DROP USER IF EXISTS 'jsonstory'@'127.0.0.1';
    CREATE USER 'jsonstory'@'127.0.0.1' IDENTIFIED BY 'jsonstory';
    GRANT ALL ON jsonstory.* TO 'jsonstory'@'127.0.0.1';
--
-- DB_HOST=127.0.0.1
-- DB_PORT=3306
-- DB_DATABASE=jsonstory
-- DB_USERNAME=jsonstory
-- DB_PASSWORD=jsonstory


-- Adminer 4.7.1 MySQL dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

USE `jsonstory`;

CREATE TABLE `diffs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `item_id` int unsigned NOT NULL,
  `update_id` int NOT NULL,
  `diff` json NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `update_id` (`update_id`),
  CONSTRAINT `diffs_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  CONSTRAINT `diffs_ibfk_2` FOREIGN KEY (`update_id`) REFERENCES `updates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;


CREATE TABLE `items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uid` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `hash` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `value` json NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;


CREATE TABLE `updates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `total` int DEFAULT NULL,
  `broken` int DEFAULT NULL,
  `inserted` int DEFAULT NULL,
  `updated` int DEFAULT NULL,
  `removed` int DEFAULT NULL,
  `error` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `finished_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
