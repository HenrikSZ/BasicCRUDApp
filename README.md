# BasicCRUDApp

# Motivation
Coding a basic web app implementing CRUD principles. It also
implements deletion with comment and undeletion features.


# Overview
CRUD interface for items and shipments of items, parts of which supports
deletion with comment and restore. Frontend is written in React with classes
and backend is Fastify with mysql2 as database interface. Testing is achieved
with Mocha, Chai and Sinon. Database migration is done with a node script
utilizing postgrator. Plain SQL migration code is found in migrations.


# Requirements
- EITHER: docker, docker-compose
- OR: node.js with npm, mysql/mariadb


# Setup

## Docker
- Copy/rename .env.example to .env
- Set a (random) DB_PASS in .env
- run: docker-compose up


## Manual
- Copy/rename .env.example to .env
- Set all fields in .env to an existing empty database
- run: npm ci
- run: npm run build:prod
- run: npm run migrate
- run: npm run start:prod


# Package scripts

## lint
Lints all files with eslint.

## build:dev
Builds the project in development mode.

## build:prod
Builds the project in production mode.

## start:dev
Starts the project in development mode. Will build the project beforehand.
Any changes in frontend code will cause a webpack rebuild.

## start:prod
Starts the project in production mode. Will NOT build anything, so you would have
to call build:prod beforehand.

## migrate <version>
Migrates the database specified in .env to the most recent version, or <version>
if specified.

## migrate:test <version>
Same thing as migrate, but for the test database whose parameters are prefixed with TEST_
in .env.

## migrate-start
First migrates the production database to the most recent version and then starts the project.
This script is used by the docker version.

## test
Builds and tests the project with its own testsuite. It is required that the TEST_ settings
in .env point to a valid database which has been migrated to the current version with migrate-test.

## test-only
Does not build the project, but just runs the testsuite.


# Database Summary
The app uses 6 different database tables. Here is a short doc about them.

## deletions
Contains deletion comments for objects that have been marked for deletion but have not yet been removed.

### Schema
- id BIGINT PRIMARY KEY NOT NULL AUTO_INCREMENT - the primary id of this deletion
- created_at TIMESTAMP NOT NULL NOW() - the time this entry was created
- updated_at  TIMESTAMP NOT NULL NOW() ON UPDATE NOW() - the last time this entry was last updated
- comment VARCHAR(255) NOT NULL - the deletion comment


## items
Contains the central information for an item.

### Schema
- id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY - the primary id of this item
- deletion_id BIGINT - the id of an entry in deletions if this item is marked for deletion
- created_at TIMESTAMP NOT NULL DEFAULT NOW() - the time this entry was created
- updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW() - the time this entry was last updated
- name VARCHAR(64) NOT NULL UNIQUE - the name of this item
- FOREIGN KEY (deletion_id) REFERENCES deletions (id) ON DELETE SET NULL


## external_item_assignments
Contains info to any item assignments that are not shipments.

### Schema
- id BIGINT NOT NULL AUTO_INCREMENT,
- PRIMARY KEY (id)


## item_assignments
Contains assignments of items. Basically changes in the number of items.

### Schema
- id BIGINT NOT NULL AUTO_INCREMENT - the primary id of this item_assignment
- item_id BIGINT NOT NULL - the id of the item that is assigned
- shipment_id BIGINT - the id of the shipment if the item is assigned to a shipment, otherwise NULL
- external_assignment_id BIGINT - the id of the external_item_assignment if it is assigned, otherwise NULL
- created_at TIMESTAMP NOT NULL DEFAULT NOW() - the time this entry was created
- updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW() - the time this entry was last updated
- assigned_count INT NOT NULL - the amount of items that are assigned
- PRIMARY KEY (id),
- FOREIGN KEY (item_id) REFERENCES items (id),
- FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE CASCADE,
- FOREIGN KEY (external_assignment_id) REFERENCES external_item_assignments (id) ON DELETE CASCADE,
- UNIQUE KEY (item_id, shipment_id, external_assignment_id),
- CONSTRAINT exactly_one_assignment_type_chk CHECK ((CASE WHEN shipment_id IS NULL THEN 0 ELSE 1 END + CASE WHEN external_assignment_id IS NULL THEN 0 ELSE 1 END) = 1)

### Triggers
- item_assignments_insert AFTER INSERT - throws an SQLEXCEPTION if the total amount of the item in question is negative
- item_assignments_insert AFTER UPDATE - throws an SQLEXCEPTION if the total amount of the item in question is negative
- item_assignments_insert AFTER DELETE - throws an SQLEXCEPTION if the total amount of the item in question is negative

### Associated Functions
- AVAIL_ITEMS_COUNT(item_id BIGINT) - returns the amount of available items


## shipments
Contains shipments of items, collections that are meant to be sent out.

### Schema
- id BIGINT NOT NULL AUTO_INCREMENT - the primary id of this shipment
- created_at TIMESTAMP NOT NULL DEFAULT NOW() - the time this entry was created
- updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW() - the time this entry was last updated
- name VARCHAR(64) NOT NULL - the name of this shipment
- destination VARCHAR(64) NOT NULl - the destination of this shipment
- PRIMARY KEY (id)


## schemaversion
Table used by postgrator to store migration information
