-- SQL Migration to add reactions and comments tables

-- 1. Create Reactions Table
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(entry_id, user_id, emoji)
);

-- Enable RLS for reactions
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- 2. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Reactions
CREATE POLICY "Users can view reactions" ON public.reactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own reactions" ON public.reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON public.reactions
    FOR DELETE USING (auth.uid() = user_id);

-- 4. RLS Policies for Comments
CREATE POLICY "Users can view comments" ON public.comments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Force schema cache reload (Supabase specific)
NOTIFY pgrst, 'reload schema';
