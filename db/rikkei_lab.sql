SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS rikkei_lab
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE rikkei_lab;

-- 1. equipments (thiết bị)
CREATE TABLE equipments (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    code           VARCHAR(20)  NOT NULL,
    name           VARCHAR(150) NOT NULL,
    category       ENUM('laptop', 'man_hinh', 'mach_dien_tu', 'phu_kien') NOT NULL,
    total_quantity INT          NOT NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_equipments_code UNIQUE (code),
    CONSTRAINT chk_equipments_total_quantity CHECK (total_quantity >= 0),
    CONSTRAINT chk_equipments_code_not_blank CHECK (CHAR_LENGTH(TRIM(code)) > 0),
    CONSTRAINT chk_equipments_name_not_blank CHECK (CHAR_LENGTH(TRIM(name)) > 0),

    INDEX idx_equipments_category (category)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- 2. borrowings (phiếu mượn)
CREATE TABLE borrowings (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id  INT          NOT NULL,
    borrower_name VARCHAR(120) NOT NULL,
    quantity      INT          NOT NULL,
    borrowed_at   DATE         NOT NULL,
    due_date      DATE         NOT NULL,
    returned_at   DATE         DEFAULT NULL,
    note          VARCHAR(255) DEFAULT NULL,

    CONSTRAINT fk_borrowings_equipment
        FOREIGN KEY (equipment_id) REFERENCES equipments (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_borrowings_quantity CHECK (quantity > 0),
    CONSTRAINT chk_borrowings_borrower_not_blank CHECK (CHAR_LENGTH(TRIM(borrower_name)) > 0),
    CONSTRAINT chk_borrowings_due_after_borrowed CHECK (due_date >= borrowed_at),
    CONSTRAINT chk_borrowings_returned_after_borrowed
        CHECK (returned_at IS NULL OR returned_at >= borrowed_at),

  
    INDEX idx_borrowings_equipment_returned (equipment_id, returned_at),

    INDEX idx_borrowings_returned_due (returned_at, due_date)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;