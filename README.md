# 🏺 KarigarAI

**Your AI-powered business manager for artisans**

KarigarAI helps artisans, weavers, and handicraft makers create professional product listings, discover the right price, and reach buyers online.

## 🚀 Quick Deploy to Render

### Option 1: One-Click Deploy

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` and deploys
5. Your app will be live at `https://karigar-ai.onrender.com`

### Option 2: Manual Deploy

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Runtime**: Python
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python main.py`
   - **Python Version**: 3.11
4. Add environment variables:
   - `DEBUG` = `false`
   - `APP_NAME` = `KarigarAI`
5. Deploy!

## 💻 Local Development

### Prerequisites
- Python 3.11+
- pip

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd karigar-ai

# Install backend dependencies
pip install -r backend/requirements.txt

# Start the server
cd backend
python main.py
```

The app runs at:
- **Frontend**: http://localhost:8000/
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📁 Project Structure

```
karigar-ai/
├── render.yaml              # Render deployment config
├── README.md
│
├── karigar-ai/              # Frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── css/
│   │   ├── variables.css
│   │   ├── global.css
│   │   ├── components.css
│   │   ├── responsive.css
│   │   └── animations.css
│   └── js/
│       ├── api.js           # Backend API client
│       ├── app.js           # Main application
│       ├── navigation.js
│       ├── mock-data.js
│       ├── localization.js
│       └── storage.js
│
└── backend/                 # Backend (FastAPI)
    ├── main.py              # App entry point
    ├── requirements.txt
    ├── .env
    ├── models/
    │   └── database.py      # SQLAlchemy ORM
    ├── routers/
    │   ├── products.py      # /api/products
    │   ├── orders.py        # /api/orders
    │   ├── image.py         # /api/images
    │   ├── catalog.py       # /api/catalog
    │   └── pricing.py       # /api/pricing
    ├── services/
    │   ├── image_service.py
    │   ├── catalog_service.py
    │   ├── pricing_service.py
    │   └── speech_service.py
    ├── uploads/             # Uploaded files
    └── outputs/             # Processed files
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List products |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/{id}` | Update product |
| `DELETE` | `/api/products/{id}` | Delete product |
| `POST` | `/api/products/{id}/publish` | Publish product |
| `GET` | `/api/orders` | List orders |
| `POST` | `/api/orders` | Create order |
| `PUT` | `/api/orders/{id}/status` | Update order status |
| `POST` | `/api/images/upload` | Upload image |
| `POST` | `/api/images/enhance` | AI enhance image |
| `POST` | `/api/catalog/transcribe` | Voice → text |
| `POST` | `/api/catalog/generate` | Text → listing |
| `POST` | `/api/pricing/recommend` | AI price suggestion |
| `GET` | `/health` | Health check |

## 🎯 Features

- ✅ Full-stack single-port deployment
- ✅ Frontend works standalone (mock data) or with API
- ✅ SQLite database (no external DB needed)
- ✅ AI image processing (Pillow)
- ✅ AI pricing recommendations
- ✅ Voice cataloging simulation
- ✅ Dark mode + 3 languages
- ✅ Mobile-first responsive design
- ✅ REST API ready for real AI integration

## 📄 License

Built for hackathon demonstration purposes.
