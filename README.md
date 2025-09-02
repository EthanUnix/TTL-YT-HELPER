# TheTechLounge Content Engine

A sophisticated, AI-powered YouTube content creation platform that automates script generation, voiceover synthesis, and visual asset curation for professional content creators.

## 🚀 Features

- **AI Script Generation**: Powered by Google Gemini for intelligent, engaging content creation
- **Automated Voiceovers**: Text-to-speech synthesis with multiple voice options
- **Visual Asset Curation**: Automatic B-roll video downloads from Pexels and AI-generated images via Hugging Face
- **Research Chat**: Interactive AI assistant for content research and ideation
- **Secure Authentication**: Google OAuth integration via Supabase
- **Professional UI**: Dark mode, glassmorphism design with smooth animations
- **Complete Workflow**: From topic input to downloadable content packages

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless Functions)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Storage**: Supabase Storage for content assets
- **APIs**: Google Gemini, Hugging Face, Pexels
- **Deployment**: Vercel

## 📋 Prerequisites

Before setting up the application, you'll need:

1. **Supabase Project**: Create a new project at [supabase.com](https://supabase.com)
2. **Google OAuth App**: Set up Google OAuth in your Supabase project
3. **API Keys**:
   - Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Hugging Face API token from [Hugging Face Settings](https://huggingface.co/settings/tokens)
   - Pexels API key from [Pexels API](https://www.pexels.com/api/)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd thetechlounge-content-engine
pnpm install
```

### 2. Environment Setup

Copy the environment template and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ENCRYPTION_KEY=your-32-character-secret-key-here
```

### 3. Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# Copy the contents of supabase-schema.sql and run in Supabase SQL editor
```

### 4. Google OAuth Configuration

In your Supabase project:

1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Set redirect URL to: `https://your-domain.com/auth/callback`

### 5. Run Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Configuration

### API Keys Setup

Users need to configure their API keys in the Settings page:

1. **Google Gemini**: For AI script generation
2. **Hugging Face**: For AI image generation
3. **Pexels**: For stock video downloads

### Storage Configuration

The application uses Supabase Storage with the following bucket:
- `content-assets`: Stores generated scripts, voiceovers, and visual asset packages

## 📁 Project Structure

```
thetechlounge-content-engine/
├── app/
│   ├── api/
│   │   ├── generateContent/
│   │   └── testConnection/
│   ├── dashboard/
│   ├── globals.css
│   └── page.tsx
├── components/
│   ├── Sidebar.tsx
│   ├── VideoGenerator.tsx
│   ├── ResearchChat.tsx
│   └── Settings.tsx
├── lib/
│   ├── supabaseClient.ts
│   └── encryption.ts
├── supabase-schema.sql
├── vercel.json
└── README.md
```

## 🎨 Design System

The application follows a "Calm-Tech Studio" aesthetic:

- **Colors**: Dark mode with blue (#00A9FF) and purple (#9C27B0) accents
- **Typography**: Inter font family for clean, modern text
- **Effects**: Glassmorphism, subtle gradients, smooth transitions
- **Layout**: Responsive design with sidebar navigation

## 🔒 Security

- **API Key Encryption**: All user API keys are encrypted before storage
- **Row Level Security**: Supabase RLS ensures users only access their own data
- **Authentication**: Secure Google OAuth flow via Supabase
- **CORS**: Properly configured for secure frontend-backend communication

## 🚀 Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic builds on push

### Environment Variables for Production

Set these in your Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_KEY`

## 📖 Usage

### Content Generation Workflow

1. **Login**: Sign in with Google account
2. **Configure**: Add API keys in Settings
3. **Generate**: Enter topic and select format in Video Generator
4. **Download**: Get script, voiceover, and visual assets

### Research Chat

Use the Research Chat for:
- Content ideation
- Topic research
- Trend analysis
- Fact-checking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub

## 🔮 Future Enhancements

- Multi-language support
- Advanced video editing features
- Team collaboration tools
- Analytics and performance tracking
- Custom voice training
- Batch content generation

---

Built with ❤️ for content creators who want to focus on what matters most: great ideas and engaging storytelling.
