-- Migration: Add audio_url column to tutorials table
-- Feature: Text-to-Speech Audio for Tutorials (LISTEN-TO-PRD)

ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS audio_url text;
