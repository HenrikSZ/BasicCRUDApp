DELIMITER $$

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
END; $$


CREATE TRIGGER shipment_items_count_too_high_insert
AFTER INSERT ON shipments_to_items
FOR EACH ROW
BEGIN
    CALL check_shipment_items_count(NEW.item_id);
END; $$

CREATE TRIGGER shipment_items_count_too_high_update
AFTER UPDATE ON shipments_to_items
FOR EACH ROW
BEGIN
    CALL check_shipment_items_count(NEW.item_id);
END; $$


CREATE TRIGGER items_count_too_low_insert
AFTER INSERT ON items
FOR EACH ROW
BEGIN
    CALL check_shipment_items_count(NEW.id);
END; $$

CREATE TRIGGER items_count_too_low_update
AFTER UPDATE ON items
FOR EACH ROW
BEGIN
    CALL check_shipment_items_count(NEW.id);
END; $$

DELIMITER ;
