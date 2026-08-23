# Project Memory & Knowledge Graph

## Architecture Summary
- **App Type**: High-school Egyptian educational platform (LMS) with live streaming, quizzes, anti-cheating, and parent tracking.
- **TopNav Architecture**: Sticky top navigation with brand (right RTL), centered links, user avatar & controls (left RTL).
- **Font**: Cairo Google Font (`--font-sans`).
- **Database**: Prisma ORM with SQLite locally (`dev.db`) and PostgreSQL for cloud deployment.
- **Live Classroom**: `@jitsi/react-sdk` with Arabic UI controls.
- **GitHub Repository**: `https://github.com/ahmedmahmoudhanafy16-del/edu-platform`
- **Active Tunnel**: Cloudflare Tunnel (`trycloudflare.com`) for instant live preview.
