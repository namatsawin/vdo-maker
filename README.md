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
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── stores/            # Zustand state management
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── public/                # Static assets
│   └── mock-assets/       # Sample media files
└── server/                # Backend code (to be implemented)
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vdo-maker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

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

**Status:** MVP Complete ✅ | Backend Integration In Progress 🔄

Built with ❤️ for efficient AI-powered video creation
