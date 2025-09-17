-- 创建申请时间线表
CREATE TABLE public.application_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  application_deadline DATE NOT NULL,
  early_deadline DATE,
  status TEXT NOT NULL DEFAULT 'not_started',
  priority INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.application_timeline ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own application timeline" 
ON public.application_timeline 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own application timeline" 
ON public.application_timeline 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own application timeline" 
ON public.application_timeline 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own application timeline" 
ON public.application_timeline 
FOR DELETE 
USING (auth.uid() = user_id);

-- 创建申请材料清单表
CREATE TABLE public.application_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'transcript', 'essay', 'recommendation', 'test_score', 'other'
  item_name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.application_checklist ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own checklist" 
ON public.application_checklist 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checklist" 
ON public.application_checklist 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist" 
ON public.application_checklist 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist" 
ON public.application_checklist 
FOR DELETE 
USING (auth.uid() = user_id);

-- 创建推荐信管理表
CREATE TABLE public.recommendation_letters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommender_name TEXT NOT NULL,
  recommender_email TEXT NOT NULL,
  recommender_title TEXT,
  relationship TEXT NOT NULL,
  university_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'requested', 'submitted', 'completed'
  request_date DATE,
  submission_deadline DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.recommendation_letters ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own recommendations" 
ON public.recommendation_letters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations" 
ON public.recommendation_letters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" 
ON public.recommendation_letters 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations" 
ON public.recommendation_letters 
FOR DELETE 
USING (auth.uid() = user_id);

-- 创建用户引导状态表
CREATE TABLE public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_steps JSONB DEFAULT '[]',
  current_step INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own onboarding" 
ON public.user_onboarding 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding" 
ON public.user_onboarding 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding" 
ON public.user_onboarding 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 为所有新表添加更新触发器
CREATE TRIGGER update_application_timeline_updated_at
  BEFORE UPDATE ON public.application_timeline
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_checklist_updated_at
  BEFORE UPDATE ON public.application_checklist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recommendation_letters_updated_at
  BEFORE UPDATE ON public.recommendation_letters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();