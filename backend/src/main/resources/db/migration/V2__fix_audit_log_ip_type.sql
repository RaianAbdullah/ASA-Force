-- Hibernate validates ip_address as varchar but SQL defined it as inet.
-- Convert to TEXT so it maps cleanly to String in Java.
ALTER TABLE audit_logs ALTER COLUMN ip_address TYPE TEXT USING ip_address::TEXT;
