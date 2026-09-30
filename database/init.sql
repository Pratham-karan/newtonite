-- init.sql — runs once on first container creation
-- Main database (newtonite_ops) is created by POSTGRES_DB env var
-- Create a separate test database for integration tests
CREATE DATABASE newtonite_ops_test;
