CREATE TABLE shipments(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    deletion_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    name VARCHAR(64) NOT NULL,
    destination VARCHAR(64) NOT NULl,
    FOREIGN KEY (deletion_id) REFERENCES deletions (id) ON DELETE SET NULL
);

CREATE TABLE shipments_to_assignments(
    shipment_id BIGINT NOT NULL,
    assignment_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES item_assignments (id) ON DELETE NO ACTION,
    PRIMARY KEY (shipment_id, item_id)
);
