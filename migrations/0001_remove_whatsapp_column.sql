-- Migration: Remove whatsapp column from content_profiles
-- The phone field in users table will be used for both phone and WhatsApp

ALTER TABLE content_profiles DROP COLUMN IF EXISTS whatsapp;
