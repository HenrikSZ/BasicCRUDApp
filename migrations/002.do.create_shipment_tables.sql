CREATE TABLE shipments(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    deletion_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    name VARCHAR(64) NOT NULL,
    destination VARCHAR(64) NOT NULl,
    FOREIGN KEY (deletion_id) REFERENCES deletions (id) ON DELETE SET NULL
);

CREATE TABLE shipments_to_items(
    shipment_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    count INT UNSIGNED NOT NULL DEFAULT 0,
    FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE NO ACTION,
    PRIMARY KEY (shipment_id, item_id)
);

CREATE PROCEDURE check_shipment_items_count(IN target_item_id BIGINT)
BEGIN
    DECLARE new_total_count BIGINT;
    DECLARE actual_count BIGINT;

    SELECT SUM(count)
        INTO new_total_count
        FROM shipments_to_items
        WHERE item_id = target_item_id;
    SELECT count
        INTO actual_count
        FROM items
        WHERE id = target_item_id;

    IF (new_total_count > actual_count)
    THEN
        SIGNAL SQLSTATE '55000'
            SET MESSAGE_TEXT = 'Total count of shipments items larger than available items';
    END IF;
END;


CREATE TRIGGER shipment_items_count_too_high_insert
AFTER INSERT ON shipments_to_items
FOR EACH ROW
BEGIN
    CALL check_shipment_items_count(NEW.item_id);
END;

CREATE TRIGGER shipment_items_count_too_high_update
AFTER UPDATE ON shipments_to_items
FOR EACH ROW
BEGIN
    CALL check_shipment_items_count(NEW.item_id);
END;


CREATE TRIGGER items_count_too_low_insert
AFTER INSERT ON items
FOR EACH ROW
BEGIN
    CALL check_shipment_items_count(NEW.id);
END;

CREATE TRIGGER items_count_too_low_update
AFTER UPDATE ON items
FOR EACH ROW
BEGIN
    CALL check_shipment_items_count(NEW.id);
END;
