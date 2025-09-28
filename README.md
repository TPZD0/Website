# Study Partner - AI-Powered Learning Companion

Study Partner is a comprehensive learning management application that helps students organize their studies, summarize documents, create flashcards, take quizzes, and track their learning goals. Built with AI-powered PDF summarization using OpenAI's GPT-3.5-turbo, this application provides intelligent study assistance to enhance your learning experience.

## ✨ Features

- **🤖 AI-Powered PDF Summarization**: Upload PDFs and get intelligent summaries using OpenAI GPT-3.5-turbo
- **👤 User Authentication**: Secure user registration and login system with encrypted passwords
- **📚 Document Management**: Upload, organize, and manage your study materials
- **🎯 Flashcards**: Create and review flashcards for effective memorization
- **📝 Quizzes**: Take interactive quizzes to test your knowledge
- **🎯 Goal Tracking**: Set and monitor your learning objectives
- **📊 Dashboard**: Centralized view of your study progress and materials
- **🎨 Modern UI**: Beautiful, responsive interface built with Material-UI

This project is developed for the Advanced Computer Programming class under the Department of Robotics and AI Engineering, School of Engineering, KMITL.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- OpenAI API key (for AI summarization features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd Study-Partner
   ```

2. **Set up environment variables:**
   ```bash
   cd fastapi
   cp .env.example .env
   ```
   
   Edit the `.env` file and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Start the application:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

### Default Test Account

For testing purposes, you can use:
- **Username**: `testuser`
- **Email**: `test@example.com`
- **Password**: `testpassword123`

Or create a new account through the registration form.

## 📁 Project Structure

```plaintext
Study-Partner/
├── docker-compose.yaml         # Docker services configuration
├── database_schema.sql         # PostgreSQL database schema
├── AI_SETUP.md                # AI feature setup guide
├── README.md                   # This file
├── nextjs/                     # Frontend application
│   ├── components/
│   │   ├── ui/                # UI components
│   │   ├── figma/             # Design components
│   │   └── NavigationBar.js   # Main navigation
│   ├── pages/
│   │   ├── dashboard.js       # Main dashboard
│   │   ├── summarizer.js      # PDF summarization page
│   │   ├── flashcards.js      # Flashcard management
│   │   ├── quiz/              # Quiz functionality
│   │   ├── goals.js           # Goal tracking
│   │   ├── settings.js        # User settings
│   │   └── login.js           # Authentication
│   ├── lib/
│   │   └── sampleData.js      # Sample data for development
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   └── Dockerfile             # Frontend container config
└── fastapi/                   # Backend API
    ├── app.py                 # FastAPI application entry point
    ├── database.py            # Database connection and queries
    ├── routes/
    │   ├── users.py           # User authentication endpoints
    │   ├── files.py           # File upload/management endpoints
    │   └── ai.py              # AI summarization endpoints
    ├── uploads/               # Uploaded PDF storage
    ├── .env                   # Environment variables (create this)
    ├── requirements.txt       # Python dependencies
    └── Dockerfile             # Backend container config
```

## 🔧 Technology Stack

### Frontend
- **Next.js** - React framework with server-side rendering
- **Material-UI (MUI)** - Modern React component library
- **Zustand** - Lightweight state management
- **JavaScript/JSX** - Programming language and syntax

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **OpenAI API** - AI-powered text summarization
- **PyPDF2** - PDF text extraction
- **Passlib[bcrypt]** - Secure password hashing
- **Asyncpg** - Asynchronous PostgreSQL driver

### Infrastructure
- **Docker & Docker Compose** - Containerization and orchestration
- **CORS Middleware** - Cross-origin resource sharing
- **Static File Serving** - File upload and storage

## 🔌 API Endpoints

### Authentication
- `POST /api/users/create` - User registration
- `POST /api/users/login` - User login

### File Management
- `POST /api/files/upload` - Upload PDF files
- `GET /api/files/{user_id}` - Get user's files

### AI Features
- `POST /api/ai/summarize` - Generate AI summary for PDF
- `GET /api/ai/summary/{file_id}` - Retrieve existing summary
- `GET /api/ai/files-with-summaries/{user_id}` - List files with summary status

## 🎯 How to Use

1. **Register/Login**: Create an account or use the test credentials
2. **Upload PDFs**: Go to the Summarizer page and upload your study materials
3. **Generate Summaries**: Click "Generate AI Summary" to get intelligent summaries
4. **Create Flashcards**: Use the flashcard feature for active recall
5. **Take Quizzes**: Test your knowledge with interactive quizzes
6. **Track Goals**: Set and monitor your learning objectives
7. **Dashboard**: Monitor your progress from the main dashboard

## 🔐 Security Features

- **Password Encryption**: Uses bcrypt for secure password hashing
- **Environment Variables**: Sensitive data stored securely
- **CORS Configuration**: Proper cross-origin request handling
- **Input Validation**: Pydantic models for data validation

## 🚨 Important Setup Notes

### OpenAI API Key Setup
1. Get your API key from [OpenAI Platform](https://platform.openai.com/)
2. Create `fastapi/.env` file with:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. See `AI_SETUP.md` for detailed configuration instructions

### Database Migration
If updating an existing database, run the migration script to add summary columns:
```bash
docker exec -i study-partner-db-1 psql -U temp -d advcompro < migrate_add_summary.sql
```

## 🐛 Troubleshooting

- **OpenAI API Issues**: Ensure API key is set and has sufficient credits
- **File Upload Problems**: Check file permissions and storage directory
- **Database Errors**: Verify PostgreSQL is running and accessible
- **Authentication Issues**: Clear localStorage and try logging in again

## 📝 Development

### Adding New Features
1. **Frontend**: Add new pages in `nextjs/pages/`
2. **Backend**: Create new routes in `fastapi/routes/`
3. **Database**: Update schema in `database_schema.sql`
4. **Don't forget**: Include new routes in `fastapi/app.py`

### API Proxy Configuration
All `/api` routes are automatically proxied to the backend server. Configuration can be modified in `next.config.mjs`.

## 📄 License

This project is developed for educational purposes as part of the Advanced Computer Programming course at KMITL.

