# 🛍️ Optimus Vintage

> Enterprise-grade vintage resale analytics platform built with React Native, PostgreSQL & Express.js

[![React Native](https://img.shields.io/badge/React%20Native-0.76-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~52.0-000.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org/)

## 📋 Overview

Optimus Vintage is a premium inventory management and financial analytics platform designed for vintage clothing resellers. Track lots, items, sales, and gain real-time insights into your business performance.

### ✨ Features

- **📦 Lot Management** - Track bulk purchases with detailed cost analysis
- **👕 Item Tracking** - Individual item status (Stock → Listed → Sold)
- **💰 Sales Analytics** - Multi-platform sales tracking (Vinted, Depop, etc.)
- **📊 Financial Insights** - ROI, floor price protection, break-even analysis
- **🌙 Dark Mode** - Premium UI with light/dark theme support

## 🏗️ Architecture

```
optimus-vintage/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   ├── lots/              # Lot detail & creation
│   └── sales/             # Sales management
├── api/                   # Express.js REST API
│   └── src/
│       ├── server.ts      # Main server
│       ├── schema.ts      # Drizzle ORM schema
│       └── validation.ts  # Zod validators
├── components/            # Reusable UI components
├── db/                    # Database layer
│   └── repositories/      # Data access layer
├── constants/             # Theme, colors, config
└── utils/                 # Business logic & calculations
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- iOS Simulator (macOS) or Android Studio
- PostgreSQL database (or Railway account)

### Installation

```bash
# Clone the repository
git clone https://github.com/GLWebDevAgency/optimus-vintage.git
cd optimus-vintage

# Install mobile app dependencies
npm install

# Install API dependencies
cd api && npm install && cd ..
```

### Environment Setup

```bash
# Mobile app (.env)
cp .env.example .env

# API (api/.env)
cp api/.env.example api/.env
# Configure your PostgreSQL credentials
```

### Running the App

```bash
# Terminal 1: Start the API
cd api && npm run dev

# Terminal 2: Start Expo
npm start
```

## 🔧 Development Workflow

### Branch Strategy (Git Flow)

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `release/*` | Release preparation |

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new lot creation form
fix: resolve rate limiting issue
docs: update README
refactor: improve repository pattern
```

# Créer une feature

```
git checkout develop
git checkout -b feature/ma-feature
```

# Développer

```
git add . && git commit -m "feat: ma feature"
git push origin feature/ma-feature
```

# Créer une PR vers develop

```
gh pr create --base develop
```

# Après validation, merger vers main pour déploiement

### Code Quality

```bash
# TypeScript check
npm run typecheck

# Run tests
npm test

# API typecheck
cd api && npm run typecheck
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/lots` | List all lots |
| POST | `/api/lots` | Create a lot |
| GET | `/api/lots/:id` | Get lot details |
| GET | `/api/items` | List items |
| POST | `/api/items` | Create item |
| GET | `/api/sales` | List sales |
| POST | `/api/sales` | Record sale |

## 🚢 Deployment

### API (Railway)

1. Connect Railway to this GitHub repo
2. Set root directory to `/api`
3. Configure environment variables
4. Deploy automatically on push to `main`

### Mobile App (Expo/EAS)

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 🛡️ Security

- ⚠️ Never commit `.env` files
- 🔐 API rate limiting enabled in production
- 🔒 CORS configured for allowed origins
- ✅ Input validation with Zod

## 📄 License

Private - © 2026 GLWebDevAgency

---

Made with ❤️ for vintage resellers
