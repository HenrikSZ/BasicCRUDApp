BasicCRUDApp
============

Motivation
----------
Coding a basic web app implementing CRUD principles. It also
implements deletion with comment and undeletion features.


Requirements
------------
- EITHER: docker, docker-compose
- OR: node.js with npm, mysql/mariadb


Setup - Docker
--------------
- Copy/rename .env.example to .env
- Set a (random) DB_PASS in .env
- run: docker-compose up


Setup - Manual
--------------
- run: npm install
- Copy/rename .env.example to .env
- Set all fields in .env to an existing empty database
- execute the db/0-setup.sql script in the database
- run: npm run start
