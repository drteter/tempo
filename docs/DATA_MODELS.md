# Data Models

## Overview
This document outlines the database schema for Tempo, including tables, relationships, and key fields.

## Core Tables

### users
- `id`: UUID (primary key)
- `email`: string
- `created_at`: timestamp
- `display_name`: string
- `avatar_url`: string (optional)
- `preferences`: jsonb (for user settings)

### goals
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users)
- `title`: string
- `description`: text
- `type`: enum ('habit', 'threshold', 'project', 'milestone', 'life_purpose', 'bucket_list')
- `status`: enum ('not_started', 'in_progress', 'completed', 'archived')
- `priority`: integer (1-5)
- `start_date`: date
- `target_date`: date (optional)
- `created_at`: timestamp
- `updated_at`: timestamp
- `category_id`: UUID (foreign key to categories)
- `parent_goal_id`: UUID (self-reference, optional, for project/milestone relationships)
- `goal_metrics`: jsonb (stores goal-specific metrics)
  - For habits: frequency, schedule
  - For threshold goals: minimum value, current value
  - For projects: completion criteria
  - For life purpose: alignment indicators

### categories
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users)
- `name`: string (predefined options: 'Health', 'Career', 'Relationships', 'Learning', 'Money', 'Creativity')
- `color`: string (hex color code)
- `icon`: string
- `created_at`: timestamp

### progress_updates
- `id`: UUID (primary key)
- `goal_id`: UUID (foreign key to goals)
- `date`: date
- `metric_type`: enum ('frequency', 'threshold', 'milestone', 'alignment')
- `value`: jsonb (flexible structure based on metric_type)
- `notes`: text (optional)
- `created_at`: timestamp

### tags
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users)
- `name`: string
- `created_at`: timestamp

### goal_tags (junction table)
- `goal_id`: UUID (foreign key to goals)
- `tag_id`: UUID (foreign key to tags)

## Relationships
- Each user has many goals
- Each user has many categories
- Each goal belongs to one category
- Each goal can have many tags (through goal_tags)
- Each goal can have many progress updates
- Goals can have parent-child relationships (for milestones)

## Indexes
- `goals(user_id)`
- `goals(category_id)`
- `progress_updates(goal_id)`
- `goal_tags(goal_id)`
- `goal_tags(tag_id)`

## Security Policies
- Users can only access their own data
- Row-level security enabled on all tables
- Public access restricted