CREATE TABLE deletions(
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    update_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    PRIMARY KEY (id),
    comment VARCHAR(255) NOT NULL
);

CREATE TABLE items(
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    deletion_id BIGINT,
    name VARCHAR(64) NOT NULL UNIQUE,
    PRIMARY KEY (id),
    FOREIGN KEY (deletion_id) REFERENCES deletions (id) ON DELETE SET NULL
);


CREATE TABLE shipments(
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    name VARCHAR(64) NOT NULL,
    source VARCHAR(64) NOT NULL,
    destination VARCHAR(64) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE external_item_assignments(
    id BIGINT NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (id)
);

CREATE TABLE item_assignments(
    id BIGINT NOT NULL AUTO_INCREMENT,
    item_id BIGINT NOT NULL,
    shipment_id BIGINT,
    external_assignment_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    assigned_count INT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (item_id) REFERENCES items (id),
    FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE CASCADE,
    FOREIGN KEY (external_assignment_id) REFERENCES external_item_assignments (id) ON DELETE CASCADE,
    UNIQUE KEY (item_id, shipment_id, external_assignment_id),
    CONSTRAINT only_one_assignment_chk CHECK ((
        CASE WHEN shipment_id IS NULL THEN 0 ELSE 1 END
        + CASE WHEN external_assignment_id IS NULL THEN 0 ELSE 1 END
    ) = 1)
);

CREATE FUNCTION AVAIL_ITEMS_COUNT(item_id BIGINT)
RETURNS INT
BEGIN
    DECLARE assigned_item_count BIGINT;

    SELECT COALESCE(SUM(assigned_count), 0) INTO assigned_item_count
        FROM item_assignments
        WHERE item_assignments.item_id = item_id;

    RETURN assigned_item_count;
END;


CREATE TRIGGER item_assignments_insert
AFTER INSERT ON item_assignments
FOR EACH ROW
BEGIN
    IF (AVAIL_ITEMS_COUNT(NEW.item_id) < 0)
    THEN
        SIGNAL SQLSTATE '55001'
            SET MESSAGE_TEXT = "Assigned item count larger than available item count";
    END IF;
END;

CREATE TRIGGER item_assignments_update
AFTER UPDATE ON item_assignments
FOR EACH ROW
BEGIN
    IF (AVAIL_ITEMS_COUNT(NEW.item_id) < 0)
    THEN
        SIGNAL SQLSTATE '55001'
            SET MESSAGE_TEXT = "Assigned item count larger than available item count";
    END IF;
END;

CREATE TRIGGER item_assignments_delete
AFTER DELETE ON item_assignments
FOR EACH ROW
BEGIN
    IF (AVAIL_ITEMS_COUNT(OLD.item_id) < 0)
    THEN
        SIGNAL SQLSTATE '55001'
            SET MESSAGE_TEXT = "Assigned item count larger than available item count";
    END IF;
END;
