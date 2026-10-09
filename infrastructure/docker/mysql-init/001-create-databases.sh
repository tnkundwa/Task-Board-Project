#!/bin/sh
# Runs once, on first container start (empty data dir), via docker-entrypoint-initdb.d.
# Plain .sql files here are executed verbatim with no variable substitution, so this is a
# shell script instead -- it can read the real MYSQL_USER env var the container was started with.
set -eu

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<-SQL
    CREATE DATABASE IF NOT EXISTS taskdb;
    CREATE DATABASE IF NOT EXISTS teamdb;
    CREATE DATABASE IF NOT EXISTS notificationdb;

    GRANT ALL PRIVILEGES ON taskdb.* TO '${MYSQL_USER}'@'%';
    GRANT ALL PRIVILEGES ON teamdb.* TO '${MYSQL_USER}'@'%';
    GRANT ALL PRIVILEGES ON notificationdb.* TO '${MYSQL_USER}'@'%';
    FLUSH PRIVILEGES;
SQL