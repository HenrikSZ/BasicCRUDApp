# BasicCRUDApp

# Motivation
Coding a basic web app implementing CRUD principles. It also
implements deletion with comment and undeletion features.


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
- run: npm run migrate up all
- run: npm run start:prod


# Database Summary
There are 6 database tables

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


## item_assignments
Contains assignments of items. Basically changes in the number of items.

### Schema
- id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY - the primary id of this item_assignment
- created_at TIMESTAMP NOT NULL DEFAULT NOW() - the time this entry was created
- updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW() - the time this entry was last updated
- item_id BIGINT NOT NULL - the id of the associated item
- assigned_count INT NOT NULL - the count that is assigned with this assignment. Increases in stock are - positive, decreases are negative.
- FOREIGN KEY (item_id) REFERENCES items (id)

### Triggers
- item_assignments_insert AFTER INSERT - throws an SQLEXCEPTION if the total amount of the item in question is negative
- item_assignments_insert AFTER UPDATE - throws an SQLEXCEPTION if the total amount of the item in question is negative
- item_assignments_insert AFTER DELETE - throws an SQLEXCEPTION if the total amount of the item in question is negative

### Associated Functions
- AVAIL_ITEMS_COUNT(item_id BIGINT) - returns the amount of available items


## shipments
Contains shipments of items, collections that are meant to be sent out.

### Schema
- id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY - the primary id of this shipment
- created_at TIMESTAMP NOT NULL DEFAULT NOW() - the time this entry was created
- updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW() - the time this entry was last updated
- name VARCHAR(64) NOT NULL - the name of this shipment
- destination VARCHAR(64) NOT NULl - the destination of this shipment

### Triggers
- shipments_delete BEFORE DELETE - deletes all shipments_to_assignments referencing this shipment


## shipments_to_assignments
Maps the assigned items to a shipment.

### Schema
- shipment_id BIGINT NOT NULL - the shipment that the assignmnent is mapped to
- assignment_id BIGINT NOT NULL - the assignment that is mapped to the shipment
- created_at TIMESTAMP NOT NULL DEFAULT NOW() - the time this entry was created
- updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW() - the time this entry was last updated
- FOREIGN KEY (shipment_id) REFERENCES shipments (id),
- FOREIGN KEY (assignment_id) REFERENCES item_assignments (id),
- PRIMARY KEY (shipment_id, assignment_id)

### Triggers
- shipments_to_assignments_delete AFTER DELETE - deletes all item_assignments referenced by this mapping


## schemaversion
Table used by postgrator to store migration information
