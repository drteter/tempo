# Tempo

## Overview
- Web app to create and manage goals and habits you want to track
- Categorize your goals and habits by area of life (E.g., health, relationships, career, etc.)
- Set weekly priorities and track progress
- Analyze your progress over time
- Designed to ensure you feel excited about your progress, but also that mastery is the ultimate goal - making you excited to show up every day

## Core Features
- Goal Management
- Habit Tracking
- Progress Reporting & Dashboards
- Basic login and authentication

## Documentation
Detailed specifications can be found in the `/docs` directory:
- [Data Models](@data_models.md) - Database schema and relationships
- [Features](@features.md) - Detailed feature specifications
- [API](/docs/api.md) - API endpoints and usage
- [UI/UX](@ui_ux.md) - Design system and user flows

## Tech Stack

### Frontend
- React - Popular UI library with great developer experience
- Vite - Fast and lightweight build tool
- TailwindCSS - Simple utility-first styling

### Backend
- Supabase - Provides authentication, database, and real-time features
  - PostgreSQL database included
  - Built-in authentication
  - Simple API interface

### Deployment
- Vercel - Easy deployment for frontend
- Supabase hosting (included) for backend

## Issues
- Add habit reminders/notifications
- Add habit categories and filtering