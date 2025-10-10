# Fetch App

Fetch is a skill-sharing platform that connects people who want to learn new skills with those who can teach them. The application uses advanced matching algorithms to find the most compatible learning partners based on skills, availability, and learning preferences.

## Features

- **Skill Matching**: Find users with complementary skills to yours
- **Direct Messaging**: Communicate with potential learning partners
- **Meeting Scheduling**: Schedule and manage learning sessions
- **User Profiles**: Showcase your skills and what you want to learn
- **Social Wall**: Share posts and engage with the community

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (v9 or later)
- [Git](https://git-scm.com/)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/Fetch.git
   cd Fetch/Fetch_App/next_js_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Setup

1. Create a `.env` file in the root directory of the project:

   ```bash
   touch .env
   ```

2. Add the following environment variables to the `.env` file:

   ```
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   HF_WRITE_TOKEN="your-huggingface-token"
   ```

   You'll need to:

   - Create a [Supabase](https://supabase.com/) project and get your URL and anon key
   - Create a [Hugging Face](https://huggingface.co/) account and get an API token

## Database Setup

This application uses Supabase as its backend. You'll need to set up the following tables in your Supabase project:

1. **users**: Stores user information
2. **user_skills**: Stores skills that users can teach or want to learn
3. **connections**: Stores connections between users
4. **messages**: Stores direct messages between users
5. **meetings**: Stores scheduled meetings
6. **posts**: Stores social wall posts
7. **comments**: Stores comments on posts

Detailed schema information can be found in the database schema documentation (if available).

## Running the Application

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Recommendation Algorithm

Fetch uses a sophisticated recommendation system to match users based on complementary skills and compatibility:

### Skill Matching

1. **Vector Embeddings**: Skills are converted into vector embeddings (numerical representations) using the Hugging Face API with the BAAI/bge-small-en-v1.5 model.

2. **Cosine Similarity**: The system calculates cosine similarity between skill embeddings to determine how well a user's teaching skills match another user's learning interests.

3. **Bidirectional Matching**: The algorithm checks both directions:
   - What User A can teach that User B wants to learn
   - What User B can teach that User A wants to learn

### User Compatibility

Beyond skills, the system also considers:

1. **Schedule Compatibility**: Analyzes overlapping availability slots between users
2. **Chronotype Matching**: Considers whether users are "early birds" or "night owls"
3. **Communication Style**: Matches users with compatible communication preferences
4. **Time Zone Alignment**: Accounts for time zone differences when suggesting meeting times

### Meeting Optimization

For highly compatible users (similarity score ≥ 0.8), the system:

1. Build the application:

   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Project Structure

```
next_js_app/
├── public/            # Static files
├── src/               # Source code
│   ├── app/           # Next.js app directory
│   │   ├── api/       # API routes
│   │   ├── auth/      # Authentication pages
│   │   ├── dm_page/   # Direct messaging
│   │   ├── learn_page/# Learning page
│   │   ├── meetings/  # Meetings management
│   │   ├── new_user/  # New user onboarding
│   │   ├── profile_page/ # User profiles
│   │   ├── search_page/  # User search
│   │   ├── social_wall/  # Social posts
│   │   └── utils/     # Utility functions
│   ├── components/    # Reusable components
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript type definitions
│   └── utility_methods/ # Utility functions
├── .env              # Environment variables
├── next.config.js    # Next.js configuration
├── package.json      # Project dependencies
└── tsconfig.json     # TypeScript configuration
```

## Key Technologies

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend and authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [React Big Calendar](https://github.com/jquense/react-big-calendar) - Calendar for scheduling
