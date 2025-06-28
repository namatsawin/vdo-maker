# AI Video Generation Platform

An AI-powered video generation platform that automates the creation of short videos with human approval checkpoints at critical stages. This application replaces traditional n8n workflows with a modern web-based interface that provides better control and quality assurance.

## 🎯 Project Overview

This platform streamlines the AI video creation process through a 6-stage workflow:
1. **Script Generation** - AI generates segmented scripts and video prompts
2. **Image Generation** - Creates first frame images for each segment
3. **Video Generation** - Produces videos from approved images
4. **Audio Generation** - Generates voice narration with TTS
5. **Segment Assembly** - Merges video and audio for each segment
6. **Final Assembly** - Combines all segments into the final video

Each stage includes human approval checkpoints to ensure quality control and consistency.

## 🚀 Current Status

### ✅ Phase 1: Frontend MVP (COMPLETED)
- Complete React TypeScript application with modern UI/UX
- Full 5-stage approval workflow implemented
- Mock data integration with realistic AI simulation
- State persistence across browser sessions
- Professional video/audio players and media handling
- Production-ready build system

### 🔄 Phase 2: Backend Integration (IN PROGRESS)
- Real AI service integrations (Gemini, Imagen4, Kling AI)
- User authentication and project management
- Database integration with PostgreSQL
- File storage with cloud services
- Real-time updates and background processing

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** + **Shadcn/ui** for styling
- **Zustand** for state management
- **React Router** for navigation

### Backend (Planned)
- **Node.js/Express** or **Python/FastAPI**
- **PostgreSQL** for data storage
- **Redis** for caching and job queues
- **AWS S3/Google Cloud** for file storage

### AI Services
- **Gemini AI** - Script generation and TTS
- **Imagen4** - Image generation
- **Kling AI (via PiAPI)** - Video generation
- **FFmpeg** - Video/audio processing

## 📁 Project Structure

```
/
├── docs/                    # Project documentation
│   ├── requirements.md      # Detailed requirements
│   ├── tasks.md            # Development tasks and progress
│   └── video-generation-api.md # API specifications
├── frontend/               # Frontend React application
│   ├── src/               # React source code
│   ├── public/            # Static assets
│   └── Dockerfile         # Frontend container
├── server/                # Backend API server
│   ├── src/              # Backend source code
│   ├── prisma/           # Database schema and migrations
│   └── Dockerfile        # Backend container
├── docker-compose.yml     # Development environment
├── docker-compose.prod.yml # Production environment
└── README.md             # This file
```

## 🚦 Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vdo-maker
   ```

2. **Set up environment variables**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your API keys
   ```

3. **Start the application**
   ```bash
   # Development environment
   docker-compose up -d
   
   # Or for production
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173 (dev) or http://localhost (prod)
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

### Local Development Setup

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### Backend Setup
```bash
cd server
npm install
npx prisma migrate dev
npm run dev
```

### Available Scripts

#### Docker Commands
```bash
# Start development environment
docker-compose up -d

# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose up --build
```

#### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

#### Backend Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run generate` - Generate Prisma client
- `npm run studio` - Open Prisma Studio

## 📋 Features

### ✅ Implemented (Phase 1)
- **Project Management** - Create, view, and manage video projects
- **Script Generation & Approval** - AI-generated scripts with human review
- **Image Generation & Approval** - First frame image creation and approval
- **Video Generation & Approval** - Video creation with quality control
- **Audio Generation & Approval** - TTS voice generation with customization
- **Final Assembly** - Complete video compilation with export options
- **State Persistence** - Progress saved across browser sessions
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Professional UI/UX** - Modern interface with smooth interactions

### 🔄 In Development (Phase 2)
- **Real AI Integration** - Connect to actual AI services
- **User Authentication** - Login, registration, and role management
- **Database Integration** - Persistent data storage
- **Real-time Updates** - WebSocket-based progress updates
- **File Management** - Cloud storage for generated assets
- **Background Processing** - Queue-based AI job processing

## 🎨 UI/UX Features

- **Modern Design System** - Consistent styling with Tailwind CSS
- **Interactive Media Players** - Custom video/audio controls
- **Drag & Drop** - Reorder segments and upload files
- **Modal Previews** - Fullscreen media viewing
- **Progress Indicators** - Visual feedback for all operations
- **Approval Workflows** - Clear status indicators and actions
- **Responsive Layout** - Optimized for all screen sizes

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL="file:./dev.db"

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# AI Services
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLOUD_PROJECT_ID=your-project-id
PIAPI_API_KEY=your-piapi-key

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=mp4,mov,avi,mp3,wav,png,jpg,jpeg

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Environment Variables
Set these in your shell or .env file for production:
```bash
export JWT_SECRET="your-production-jwt-secret"
export GEMINI_API_KEY="your-gemini-api-key"
export GOOGLE_CLOUD_PROJECT_ID="your-project-id"
export PIAPI_API_KEY="your-piapi-key"
```

## 📊 Project Metrics & Goals

### Target Performance
- Reduce video creation time by 50%
- Achieve 95% user satisfaction rating
- Process 1000+ videos per month
- Maintain < 5% error rate in AI generations

### Quality Metrics
- 99.5% uptime target
- < 200ms UI response times
- < 30 seconds AI service response times
- Support 100+ concurrent users

## 🔐 Security & Privacy

- JWT-based authentication (planned)
- Role-based access control (Admin, Creator, Viewer)
- API rate limiting and input validation
- Secure file upload and storage
- GDPR compliance for EU users
- Audit logging for all actions

## 📈 Development Roadmap

### Phase 1: Frontend MVP ✅ (Weeks 1-4)
- Complete React application with mock data
- All workflow stages implemented
- Professional UI/UX design
- State management and persistence

### Phase 2: Backend Integration 🔄 (Weeks 5-10)
- Real AI service integrations
- User authentication system
- Database and file storage
- Background job processing

### Phase 3: Production Ready 📅 (Weeks 11-13)
- Real-time features
- Monitoring and analytics
- Performance optimization
- Comprehensive testing

### Phase 4: Advanced Features 📅 (Future)
- Multi-tenant architecture
- Advanced analytics
- Mobile application
- Enterprise features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Documentation

- [Requirements Document](./docs/requirements.md) - Detailed project requirements
- [Task Breakdown](./docs/tasks.md) - Development tasks and progress
- [API Documentation](./docs/video-generation-api.md) - AI service API specifications

## 🐳 Docker Support

This project includes comprehensive Docker support for both development and production environments:

- **Development**: Hot reload, volume mounting, debug-friendly
- **Production**: Optimized builds, security hardening, health checks
- **Multi-stage builds**: Efficient container sizes
- **Docker Compose**: Orchestrated services with networking

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the task breakdown for development progress

## 🎉 Acknowledgments

- **Gemini AI** for script generation and TTS capabilities
- **Imagen4** for high-quality image generation
- **Kling AI** for advanced video generation
- **Shadcn/ui** for beautiful UI components
- **Tailwind CSS** for utility-first styling

---

**Status:** MVP Complete ✅ | Backend Integration In Progress 🔄 | Docker Ready 🐳

Built with ❤️ for efficient AI-powered video creation
