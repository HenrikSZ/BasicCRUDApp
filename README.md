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


Setup - Docker [CURRENTLY NOT WORKING DUE TO INVALID TYPEDEFS FOR TYPESCRIPT]
--------------
- Copy/rename .env.example to .env
- Set a (random) DB_PASS in .env
- run: docker-compose up


Setup - Manual
--------------
- Copy/rename .env.example to .env
- Set all fields in .env to an existing empty database
- run: npm ci
- Because there are different type definitions for webpack, we must change the file node_modules/@types/webpack-hot-middleware/index.d.ts: Change webpack.ICompiler to webpack.Compiler
- run: npm run build:prod
- run: npm run migrate up all
- run: npm run start:prod
