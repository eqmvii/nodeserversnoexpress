DROP DATABASE IF EXISTS urlong_db;
CREATE database urlong_db;

USE urlong_db;

CREATE TABLE urls (
  id INT NOT NULL,
  url VARCHAR(100) NULL,
  urlong VARCHAR(2100) NULL,
  PRIMARY KEY (id)
);
