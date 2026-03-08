-- ============================================
-- Prompt Ark Hub - Supabase Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PROMPTS TABLE
-- ============================================
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  author TEXT NOT NULL DEFAULT 'anonymous',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_avatar TEXT,
  quality_score INTEGER,
  language TEXT DEFAULT 'en',
  variable_count INTEGER,
  token_estimate INTEGER,
  type TEXT NOT NULL DEFAULT 'prompt' CHECK (type IN ('prompt', 'pack')),
  pack_count INTEGER,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  install_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_prompts_category ON public.prompts(category);
CREATE INDEX idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX idx_prompts_quality_score ON public.prompts(quality_score DESC);

-- ============================================
-- VOTES TABLE
-- ============================================
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

CREATE INDEX idx_votes_prompt_id ON public.votes(prompt_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Prompts policies
CREATE POLICY "Public prompts are viewable by everyone" ON public.prompts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert prompts" ON public.prompts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can update own prompts" ON public.prompts FOR UPDATE USING (auth.uid() = author_id OR author_id IS NULL);

-- Votes policies
CREATE POLICY "Authenticated users can insert votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA (Demo)
-- ============================================
INSERT INTO public.prompts (title, description, content, category, tags, author, quality_score, language, variable_count, token_estimate, type) VALUES
('Professional Email Writer', 'Write polished, professional emails for any business context.', 'You are an expert business communication specialist. Write a **{{tone}}** email...', 'Productivity', ARRAY['email', 'business'], 'prompt-ark', 88, 'en', 3, 280, 'prompt'),
('Code Review Expert', 'Thorough code review assistant for bugs, security, and best practices.', 'You are a senior software engineer performing a thorough code review...', 'Coding', ARRAY['code-review', 'development'], 'prompt-ark', 92, 'en', 2, 450, 'prompt'),
('Content Strategy Pack', 'A collection of 5 prompts for content strategy.', 'This pack contains 5 prompts for content strategy.', 'Creative', ARRAY['content', 'marketing'], 'prompt-ark', 85, 'en', 4, 1200, 'pack'),
('学术论文助手', '结构化学术写作助手，支持论文大纲、文献综述等。', '你是一位资深学术写作顾问...', 'Education', ARRAY['academic', 'research'], 'prompt-ark', 80, 'zh', 5, 520, 'prompt'),
('Data Analysis Interpreter', 'Transform raw data into actionable insights.', 'You are a data analyst...', 'Analysis', ARRAY['data', 'analytics'], 'prompt-ark', 78, 'en', 3, 380, 'prompt'),
('Creative Story Builder', 'Interactive story generation with customizable parameters.', 'You are a master storyteller...', 'Writing', ARRAY['story', 'creative'], 'prompt-ark', 75, 'en', 6, 420, 'prompt');
