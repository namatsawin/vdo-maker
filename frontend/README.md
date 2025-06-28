# VDO Maker - AI Video Generation Platform

A React-based web application for creating AI-generated videos with human approval workflows.

## Features

- **AI-Powered Video Generation**: Automated video creation using multiple AI services
- **Human Approval Workflow**: Quality control at every stage of generation
- **Multi-Stage Process**: Script → Image → Video → Audio → Final Assembly
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite 5+
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Media Handling**: React Player

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd vdo-maker
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   ├── layout/         # Layout components
│   ├── forms/          # Form components
│   ├── media/          # Media handling components
│   └── workflow/       # Workflow-specific components
├── pages/              # Route components
├── lib/                # Utility functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── data/               # Mock data for demo
├── utils/              # Helper utilities
└── stores/             # Zustand state stores

public/
└── mock-assets/        # Sample media files
    ├── images/         # Sample images
    ├── videos/         # Sample videos
    └── audio/          # Sample audio files
```

## Workflow Stages

1. **Script Generation**: AI generates segmented scripts with video prompts
2. **Image Generation**: Create first frame images for each segment
3. **Video Generation**: Generate videos from images using AI
4. **Audio Generation**: Create audio narration from scripts
5. **Final Assembly**: Merge video and audio, concatenate segments

Each stage requires human approval before proceeding to the next.

## Development

### Code Style

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Tailwind CSS for styling

### Adding New Components

1. Create component in appropriate directory under `src/components/`
2. Export from component's index file
3. Add TypeScript interfaces in `src/types/`
4. Follow existing naming conventions

### State Management

- Use Zustand for global state
- Keep component-specific state local
- Persist important state to localStorage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
