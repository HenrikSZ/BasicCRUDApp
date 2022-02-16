CREATE TABLE deletions(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    update_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    comment VARCHAR(255) NOT NULL
);

CREATE TABLE items(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    name VARCHAR(64) NOT NULL UNIQUE
);

CREATE TABLE item_assignments(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    item_id BIGINT NOT NULL,
    assigned_count INT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items (id)
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
