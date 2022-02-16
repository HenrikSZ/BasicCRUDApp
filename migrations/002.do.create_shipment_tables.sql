CREATE TABLE shipments(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    name VARCHAR(64) NOT NULL,
    destination VARCHAR(64) NOT NULL
);

CREATE TABLE shipments_to_assignments(
    shipment_id BIGINT NOT NULL,
    assignment_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (shipment_id) REFERENCES shipments (id),
    FOREIGN KEY (assignment_id) REFERENCES item_assignments (id),
    PRIMARY KEY (shipment_id, assignment_id)
);

CREATE TRIGGER shipments_delete
BEFORE DELETE ON shipments
FOR EACH ROW
BEGIN
    DELETE FROM shipments_to_assignments WHERE shipment_id = OLD.id;
END;

CREATE TRIGGER shipments_to_assignments_delete
AFTER DELETE ON shipments_to_assignments
FOR EACH ROW
BEGIN
    DELETE FROM item_assignments WHERE id = OLD.assignment_id;
END;
