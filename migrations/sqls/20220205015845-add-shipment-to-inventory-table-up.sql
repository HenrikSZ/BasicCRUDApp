CREATE TABLE shipment_to_inventory(
    shipment_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    count INT NOT NULL DEFAULT 0,
    FOREIGN KEY (shipment_id) REFERENCES shipments (id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory (id) ON DELETE RESTRICT
);
