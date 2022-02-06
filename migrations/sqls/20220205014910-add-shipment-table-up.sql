CREATE TABLE shipments(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    deletion_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    name VARCHAR(64) NOT NULL,
    destination VARCHAR(64) NOT Null,
    FOREIGN KEY (deletion_id) REFERENCES deletions (id) ON DELETE SET NULL
);
