-- =========================================================
-- Migration: Add 'degree' field to Regulation table
-- Purpose  : Differentiate BE, BTech, ME, MTech regulations per dept/year
-- Unique key: departmentId + degree + regulationYear
-- Default  : Existing rows default to 'BE'
-- =========================================================

-- Step 1: Add degree column (defaults existing rows to 'BE')
ALTER TABLE Regulation
  ADD COLUMN IF NOT EXISTS degree ENUM('BE', 'BTech', 'ME', 'MTech') NOT NULL DEFAULT 'BE'
  AFTER departmentId;

-- Step 2: Drop any existing unique index on (departmentId, regulationYear)
-- MySQL does not support DROP INDEX IF EXISTS in older versions, so we wrap
-- in a stored procedure to avoid errors if the index doesn't exist.
DROP PROCEDURE IF EXISTS drop_regulation_unique_index;
DELIMITER $$
CREATE PROCEDURE drop_regulation_unique_index()
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'Regulation'
      AND INDEX_NAME  != 'PRIMARY'
      AND SEQ_IN_INDEX = 1
      AND COLUMN_NAME  = 'departmentId'
  ) THEN
    -- Find the index name dynamically
    SET @idx_name = (
      SELECT INDEX_NAME FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = 'Regulation'
        AND INDEX_NAME  != 'PRIMARY'
        AND NON_UNIQUE   = 0
        AND SEQ_IN_INDEX = 1
        AND COLUMN_NAME  = 'departmentId'
      LIMIT 1
    );
    IF @idx_name IS NOT NULL THEN
      SET @sql = CONCAT('ALTER TABLE Regulation DROP INDEX `', @idx_name, '`');
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    END IF;
  END IF;
END $$
DELIMITER ;
CALL drop_regulation_unique_index();
DROP PROCEDURE IF EXISTS drop_regulation_unique_index;

-- Step 3: Add new composite unique constraint
ALTER TABLE Regulation
  ADD CONSTRAINT uq_regulation_dept_degree_year
  UNIQUE (departmentId, degree, regulationYear);

-- Verify
SELECT 'Migration complete: degree column added (BE, BTech, ME, MTech) and unique constraint updated.' AS status;
