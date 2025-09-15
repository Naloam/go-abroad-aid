-- 创建成绩单相关表
CREATE TABLE public.transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '我的成绩单',
  total_credits DECIMAL(8,2),
  weighted_gpa DECIMAL(4,2),
  unweighted_gpa DECIMAL(4,2),
  gpa_scale TEXT DEFAULT '4.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 成绩记录表
CREATE TABLE public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript_id UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  course_name TEXT NOT NULL,
  course_code TEXT,
  credits DECIMAL(4,1) NOT NULL,
  grade TEXT NOT NULL, -- 原始成绩（如85、A-等）
  gpa_points DECIMAL(4,2), -- 转换后的GPA点数
  course_type TEXT DEFAULT 'regular', -- regular, honors, ap等
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 院校数据表
CREATE TABLE public.universities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  country TEXT NOT NULL,
  city TEXT,
  type TEXT, -- public, private
  ranking_qs INTEGER,
  ranking_times INTEGER,
  ranking_us_news INTEGER,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 专业项目表
CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  degree_level TEXT NOT NULL, -- bachelor, master, phd
  field TEXT, -- engineering, business, arts等
  duration_years INTEGER,
  tuition_usd INTEGER,
  min_gpa DECIMAL(4,2),
  avg_gpa DECIMAL(4,2),
  language_requirement TEXT, -- IELTS 6.5, TOEFL 90等
  application_deadline TEXT,
  scholarship_available BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 申请材料表
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '申请材料',
  personal_statement TEXT,
  resume_content TEXT,
  research_plan TEXT,
  status INTEGER DEFAULT 0, -- 0: draft, 1: completed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 用户偏好表
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_countries TEXT[] DEFAULT '{}',
  target_degree_level TEXT, -- bachelor, master, phd
  budget_min INTEGER,
  budget_max INTEGER,
  preferred_fields TEXT[] DEFAULT '{}',
  language_scores JSONB, -- {ielts: 7.0, toefl: 100}
  gre_scores JSONB, -- {verbal: 160, quantitative: 170, writing: 4.5}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 启用RLS
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- transcripts表策略
CREATE POLICY "Users can view their own transcripts" 
ON public.transcripts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transcripts" 
ON public.transcripts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transcripts" 
ON public.transcripts FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transcripts" 
ON public.transcripts FOR DELETE 
USING (auth.uid() = user_id);

-- grades表策略
CREATE POLICY "Users can view grades of their transcripts" 
ON public.grades FOR SELECT 
USING (EXISTS(
  SELECT 1 FROM public.transcripts 
  WHERE transcripts.id = grades.transcript_id 
  AND transcripts.user_id = auth.uid()
));

CREATE POLICY "Users can insert grades to their transcripts" 
ON public.grades FOR INSERT 
WITH CHECK (EXISTS(
  SELECT 1 FROM public.transcripts 
  WHERE transcripts.id = grades.transcript_id 
  AND transcripts.user_id = auth.uid()
));

CREATE POLICY "Users can update grades of their transcripts" 
ON public.grades FOR UPDATE 
USING (EXISTS(
  SELECT 1 FROM public.transcripts 
  WHERE transcripts.id = grades.transcript_id 
  AND transcripts.user_id = auth.uid()
));

CREATE POLICY "Users can delete grades of their transcripts" 
ON public.grades FOR DELETE 
USING (EXISTS(
  SELECT 1 FROM public.transcripts 
  WHERE transcripts.id = grades.transcript_id 
  AND transcripts.user_id = auth.uid()
));

-- universities和programs表 - 公开读取
CREATE POLICY "Universities are viewable by everyone" 
ON public.universities FOR SELECT 
USING (true);

CREATE POLICY "Programs are viewable by everyone" 
ON public.programs FOR SELECT 
USING (true);

-- applications表策略
CREATE POLICY "Users can view their own applications" 
ON public.applications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" 
ON public.applications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" 
ON public.applications FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" 
ON public.applications FOR DELETE 
USING (auth.uid() = user_id);

-- user_preferences表策略
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
ON public.user_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 创建更新时间戳的触发器
CREATE TRIGGER update_transcripts_updated_at
BEFORE UPDATE ON public.transcripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_universities_updated_at
BEFORE UPDATE ON public.universities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 插入一些示例院校数据
INSERT INTO public.universities (name, name_en, country, city, type, ranking_qs, website) VALUES
('哈佛大学', 'Harvard University', 'United States', 'Cambridge', 'private', 5, 'https://www.harvard.edu'),
('麻省理工学院', 'Massachusetts Institute of Technology', 'United States', 'Cambridge', 'private', 1, 'https://www.mit.edu'),
('斯坦福大学', 'Stanford University', 'United States', 'Stanford', 'private', 3, 'https://www.stanford.edu'),
('剑桥大学', 'University of Cambridge', 'United Kingdom', 'Cambridge', 'public', 2, 'https://www.cam.ac.uk'),
('牛津大学', 'University of Oxford', 'United Kingdom', 'Oxford', 'public', 4, 'https://www.ox.ac.uk'),
('多伦多大学', 'University of Toronto', 'Canada', 'Toronto', 'public', 34, 'https://www.utoronto.ca'),
('墨尔本大学', 'University of Melbourne', 'Australia', 'Melbourne', 'public', 14, 'https://www.unimelb.edu.au');

-- 插入示例专业数据
INSERT INTO public.programs (university_id, name, name_en, degree_level, field, duration_years, tuition_usd, min_gpa, avg_gpa, language_requirement) 
SELECT 
  u.id,
  CASE 
    WHEN u.name_en = 'Harvard University' THEN '计算机科学硕士'
    WHEN u.name_en = 'Massachusetts Institute of Technology' THEN '人工智能硕士'
    WHEN u.name_en = 'Stanford University' THEN '数据科学硕士'
    WHEN u.name_en = 'University of Cambridge' THEN '工程学硕士'
    WHEN u.name_en = 'University of Oxford' THEN '计算机科学硕士'
    WHEN u.name_en = 'University of Toronto' THEN '计算机科学硕士'
    WHEN u.name_en = 'University of Melbourne' THEN '信息技术硕士'
  END,
  CASE 
    WHEN u.name_en = 'Harvard University' THEN 'Master of Computer Science'
    WHEN u.name_en = 'Massachusetts Institute of Technology' THEN 'Master of Artificial Intelligence'
    WHEN u.name_en = 'Stanford University' THEN 'Master of Data Science'
    WHEN u.name_en = 'University of Cambridge' THEN 'Master of Engineering'
    WHEN u.name_en = 'University of Oxford' THEN 'Master of Computer Science'
    WHEN u.name_en = 'University of Toronto' THEN 'Master of Computer Science'
    WHEN u.name_en = 'University of Melbourne' THEN 'Master of Information Technology'
  END,
  'master',
  'engineering',
  2,
  CASE 
    WHEN u.country = 'United States' THEN 55000
    WHEN u.country = 'United Kingdom' THEN 45000
    WHEN u.country = 'Canada' THEN 35000
    WHEN u.country = 'Australia' THEN 40000
  END,
  3.3,
  3.7,
  CASE 
    WHEN u.country = 'United States' THEN 'TOEFL 100, IELTS 7.0'
    WHEN u.country = 'United Kingdom' THEN 'IELTS 7.0, TOEFL 100'
    WHEN u.country = 'Canada' THEN 'IELTS 6.5, TOEFL 90'
    WHEN u.country = 'Australia' THEN 'IELTS 6.5, TOEFL 90'
  END
FROM public.universities u;