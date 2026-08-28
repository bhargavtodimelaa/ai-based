# 🏺 KarigarAI

**Your AI-powered business manager for artisans**

KarigarAI helps artisans, weavers, and handicraft makers create professional product listings, discover the right price, and reach buyers online.

## 🚀 Quick Start

Simply open `index.html` in your browser, or serve it with any local server:

```bash
# Using Python
cd karigar-ai
python -m http.server 8000

# Using Node.js (npx)
npx serve karigar-ai

# Using PHP
cd karigar-ai
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 📱 Features

### Complete Demo Flow
1. **Landing Page** — Beautiful hero with workflow visualization
2. **Login** — Demo login (no real auth needed)
3. **Dashboard** — Stats, AI assistant, recent products, quick actions
4. **Add Product** — Multi-step guided flow:
   - 📸 Photo upload (or demo product)
   - 🤖 AI Image Studio with before/after slider
   - 🎤 Voice Cataloger (simulated)
   - ✨ AI Generated Listing
   - 💰 AI Pricing
   - 👁️ Product Preview
   - 🚀 Publish
5. **My Products** — Search, filter, sort, manage products
6. **Marketplace** — Browse published products like an e-commerce platform
7. **Orders** — View and manage orders with timeline tracking
8. **Profile** — Settings, language, dark mode

### UI Features
- ✅ Mobile-first responsive design (360px → 1280px+)
- ✅ Dark mode with localStorage persistence
- ✅ 3 languages (English, Hindi, Telugu)
- ✅ AI processing animations
- ✅ Before/after image comparison slider
- ✅ Microphone recording simulation
- ✅ Floating AI chat assistant
- ✅ Toast notifications
- ✅ Smooth page transitions
- ✅ Product creation flow
- ✅ Confetti celebration on publish

## 🎨 Tech Stack

- HTML5
- CSS3 (Custom Properties, Grid, Flexbox, Animations)
- Vanilla JavaScript (no frameworks)

## 📁 Project Structure

```
karigar-ai/
├── index.html
├── css/
│   ├── variables.css      — Color system, typography, spacing
│   ├── global.css         — Reset, base styles, layout
│   ├── components.css     — Reusable UI components
│   ├── responsive.css     — Mobile-first breakpoints
│   └── animations.css     — Keyframes and transitions
├── js/
│   ├── app.js             — Main application logic
│   ├── navigation.js      — SPA routing and page transitions
│   ├── mock-data.js       — Products, orders, AI responses
│   ├── localization.js    — English, Hindi, Telugu translations
│   └── storage.js         — localStorage persistence
├── assets/
│   ├── images/
│   ├── icons/
│   └── logo/
└── README.md
```

## 🎯 Hackathon Story

```
Traditional Artisan → Take Photo → AI Enhances Image →
Speak in Regional Language → AI Creates Listing →
AI Suggests Price → Publish → Reach Digital Buyers
```

## 🔧 Backend API

The `backend/` directory contains a FastAPI backend ready for integration.

### Setup

```bash
cd backend
pip install -r requirements.txt
# Edit .env with your OpenAI API key (optional)
python main.py
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET/POST | List/Create products |
| `/api/products/{id}` | GET/PUT/DELETE | Manage a product |
| `/api/orders` | GET/POST | List/Create orders |
| `/api/images/upload` | POST | Upload product image |
| `/api/images/enhance` | POST | AI image enhancement |
| `/api/catalog/transcribe` | POST | Voice-to-text |
| `/api/catalog/generate` | POST | Generate listing from text |
| `/api/pricing/recommend` | POST | AI price recommendation |

API docs: `http://localhost:8000/docs`

## 📄 License

Built for hackathon demonstration purposes.
