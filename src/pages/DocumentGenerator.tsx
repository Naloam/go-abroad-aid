import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  RefreshCw, 
  User, 
  BookOpen,
  Target,
  Award,
  Lightbulb,
  Copy,
  Save
} from "lucide-react";

interface UserProfile {
  full_name: string;
  email: string;
  university: string;
  major: string;
  graduation_year: number;
  target_degree: string;
  target_countries: string[];
}

interface DocumentData {
  personalStatement: string;
  resume: string;
  researchPlan: string;
}

const DocumentGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<DocumentData>({
    personalStatement: '',
    resume: '',
    researchPlan: ''
  });
  const [loading, setLoading] = useState(false);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState({
    researchInterests: '',
    academicBackground: '',
    workExperience: '',
    projects: '',
    publications: '',
    awards: '',
    whyThisProgram: '',
    careerGoals: '',
    personalStory: '',
    style: 'academic' // academic, personal, professional
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data && !error) {
        setProfile(data);
      }
    } catch (error) {
      console.error('获取用户资料失败:', error);
    }
  };

  const generatePersonalStatement = async () => {
    if (!profile) {
      toast({
        title: "请先完善个人资料",
        description: "生成申请材料需要您的基本信息",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const prompt = `
作为一名专业的留学申请顾问，请帮助生成一份${formData.style === 'academic' ? '学术型' : formData.style === 'personal' ? '个人化' : '职业导向'}的个人陈述(Personal Statement)。

申请者信息：
- 姓名：${profile.full_name}
- 本科院校：${profile.university}
- 专业：${profile.major}
- 毕业年份：${profile.graduation_year}
- 目标学位：${profile.target_degree}
- 目标国家：${profile.target_countries?.join(', ')}

详细背景：
- 研究兴趣：${formData.researchInterests}
- 学术背景：${formData.academicBackground}
- 工作经历：${formData.workExperience}
- 项目经历：${formData.projects}
- 发表论文：${formData.publications}
- 获奖经历：${formData.awards}
- 选择该项目的原因：${formData.whyThisProgram}
- 职业目标：${formData.careerGoals}
- 个人故事：${formData.personalStory}

请生成一份800-1000字的个人陈述，包含以下要素：
1. 引人入胜的开头
2. 学术背景和成就
3. 研究兴趣和经历
4. 选择该项目的原因
5. 未来职业规划
6. 有力的结尾

语言要求：流畅的英文表达，避免模板化语言，突出个人特色。
      `;

      const response = await supabase.functions.invoke('generate-document', {
        body: { 
          prompt,
          type: 'personal_statement',
          style: formData.style
        }
      });

      if (response.error) throw response.error;

      const generatedText = response.data?.content || '';
      setDocuments(prev => ({ ...prev, personalStatement: generatedText }));
      
      toast({
        title: "个人陈述生成成功",
        description: "请查看并根据需要进行编辑",
      });
    } catch (error) {
      console.error('生成个人陈述失败:', error);
      toast({
        title: "生成失败",
        description: "请检查网络连接后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateResume = async () => {
    if (!profile) {
      toast({
        title: "请先完善个人资料",
        description: "生成简历需要您的基本信息",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const prompt = `
请为以下申请者生成一份专业的英文简历(Resume/CV)：

基本信息：
- 姓名：${profile.full_name}
- 邮箱：${profile.email}
- 本科院校：${profile.university}
- 专业：${profile.major}
- 毕业年份：${profile.graduation_year}

详细信息：
- 学术背景：${formData.academicBackground}
- 工作经历：${formData.workExperience}
- 项目经历：${formData.projects}
- 发表论文：${formData.publications}
- 获奖经历：${formData.awards}

请按以下格式生成简历：
1. Contact Information
2. Education
3. Research Experience
4. Work Experience
5. Publications (if any)
6. Awards and Honors
7. Skills
8. Projects

要求：专业格式，突出学术和研究成就，适合${profile.target_degree}申请。
      `;

      const response = await supabase.functions.invoke('generate-document', {
        body: { 
          prompt,
          type: 'resume'
        }
      });

      if (response.error) throw response.error;

      const generatedText = response.data?.content || '';
      setDocuments(prev => ({ ...prev, resume: generatedText }));
      
      toast({
        title: "简历生成成功",
        description: "请查看并根据需要进行编辑",
      });
    } catch (error) {
      console.error('生成简历失败:', error);
      toast({
        title: "生成失败",
        description: "请检查网络连接后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateResearchPlan = async () => {
    if (!profile) {
      toast({
        title: "请先完善个人资料",
        description: "生成研究计划需要您的基本信息",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const prompt = `
请为以下申请者生成一份研究计划(Research Plan/Statement of Purpose)：

申请者背景：
- 研究领域：${profile.major}
- 目标学位：${profile.target_degree}
- 研究兴趣：${formData.researchInterests}
- 学术背景：${formData.academicBackground}
- 项目经历：${formData.projects}
- 发表论文：${formData.publications}

请生成一份结构完整的研究计划，包含：
1. Research Background and Motivation
2. Literature Review
3. Research Questions and Objectives
4. Methodology
5. Expected Contributions
6. Timeline
7. Conclusion

要求：学术性强，逻辑清晰，展现研究能力和创新思维。
      `;

      const response = await supabase.functions.invoke('generate-document', {
        body: { 
          prompt,
          type: 'research_plan'
        }
      });

      if (response.error) throw response.error;

      const generatedText = response.data?.content || '';
      setDocuments(prev => ({ ...prev, researchPlan: generatedText }));
      
      toast({
        title: "研究计划生成成功",
        description: "请查看并根据需要进行编辑",
      });
    } catch (error) {
      console.error('生成研究计划失败:', error);
      toast({
        title: "生成失败",
        description: "请检查网络连接后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDocuments = async () => {
    if (!user) return;

    try {
      const applicationData = {
        user_id: user.id,
        title: `申请材料 - ${new Date().toLocaleDateString()}`,
        personal_statement: documents.personalStatement,
        resume_content: documents.resume,
        research_plan: documents.researchPlan,
        status: 0
      };

      if (currentApplicationId) {
        const { error } = await supabase
          .from('applications')
          .update(applicationData)
          .eq('id', currentApplicationId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('applications')
          .insert(applicationData)
          .select()
          .single();
        
        if (error) throw error;
        setCurrentApplicationId(data.id);
      }

      toast({
        title: "保存成功",
        description: "申请材料已保存到您的账户",
      });
    } catch (error) {
      console.error('保存失败:', error);
      toast({
        title: "保存失败",
        description: "请重试",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "复制成功",
      description: `${type}已复制到剪贴板`,
    });
  };

  const downloadDocument = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "下载成功",
      description: `${filename}已下载`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              申请材料生成器
            </h1>
            <p className="text-muted-foreground">
              基于AI技术，智能生成个人陈述、简历和研究计划
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：信息输入 */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    基本信息
                  </CardTitle>
                  <CardDescription>
                    {profile ? '信息已从个人资料获取' : '请先完善个人资料'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile ? (
                    <div className="space-y-3 text-sm">
                      <div><strong>姓名:</strong> {profile.full_name}</div>
                      <div><strong>院校:</strong> {profile.university}</div>
                      <div><strong>专业:</strong> {profile.major}</div>
                      <div><strong>毕业年份:</strong> {profile.graduation_year}</div>
                      <div><strong>目标学位:</strong> {profile.target_degree}</div>
                      <div><strong>目标国家:</strong> {profile.target_countries?.join(', ')}</div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">请先到个人资料页面完善基本信息</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>详细信息</CardTitle>
                  <CardDescription>提供更多信息以生成更精准的材料</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="style">文书风格</Label>
                    <Select value={formData.style} onValueChange={(value) => setFormData(prev => ({ ...prev, style: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">学术型</SelectItem>
                        <SelectItem value="personal">个人化</SelectItem>
                        <SelectItem value="professional">职业导向</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="researchInterests">研究兴趣</Label>
                    <Textarea
                      id="researchInterests"
                      placeholder="描述您的研究兴趣和方向..."
                      value={formData.researchInterests}
                      onChange={(e) => setFormData(prev => ({ ...prev, researchInterests: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="academicBackground">学术背景</Label>
                    <Textarea
                      id="academicBackground"
                      placeholder="描述您的学术经历、课程成绩等..."
                      value={formData.academicBackground}
                      onChange={(e) => setFormData(prev => ({ ...prev, academicBackground: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="workExperience">工作经历</Label>
                    <Textarea
                      id="workExperience"
                      placeholder="描述相关的工作或实习经历..."
                      value={formData.workExperience}
                      onChange={(e) => setFormData(prev => ({ ...prev, workExperience: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="projects">项目经历</Label>
                    <Textarea
                      id="projects"
                      placeholder="描述参与的研究项目或实践项目..."
                      value={formData.projects}
                      onChange={(e) => setFormData(prev => ({ ...prev, projects: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="publications">发表论文</Label>
                    <Textarea
                      id="publications"
                      placeholder="列举已发表的论文或文章..."
                      value={formData.publications}
                      onChange={(e) => setFormData(prev => ({ ...prev, publications: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="awards">获奖经历</Label>
                    <Textarea
                      id="awards"
                      placeholder="列举获得的奖项和荣誉..."
                      value={formData.awards}
                      onChange={(e) => setFormData(prev => ({ ...prev, awards: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="whyThisProgram">选择该项目的原因</Label>
                    <Textarea
                      id="whyThisProgram"
                      placeholder="为什么选择这个项目/学校..."
                      value={formData.whyThisProgram}
                      onChange={(e) => setFormData(prev => ({ ...prev, whyThisProgram: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="careerGoals">职业目标</Label>
                    <Textarea
                      id="careerGoals"
                      placeholder="描述您的职业规划和目标..."
                      value={formData.careerGoals}
                      onChange={(e) => setFormData(prev => ({ ...prev, careerGoals: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="personalStory">个人故事</Label>
                    <Textarea
                      id="personalStory"
                      placeholder="分享能体现您个人特色的经历..."
                      value={formData.personalStory}
                      onChange={(e) => setFormData(prev => ({ ...prev, personalStory: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：生成结果 */}
            <div className="lg:col-span-2">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>生成的申请材料</CardTitle>
                  <CardDescription>AI生成的材料，请根据需要进行编辑</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="personal-statement" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="personal-statement">个人陈述</TabsTrigger>
                      <TabsTrigger value="resume">简历</TabsTrigger>
                      <TabsTrigger value="research-plan">研究计划</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="personal-statement" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Personal Statement</h3>
                        <div className="flex gap-2">
                          <Button
                            onClick={generatePersonalStatement}
                            disabled={loading}
                            size="sm"
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            生成
                          </Button>
                          {documents.personalStatement && (
                            <>
                              <Button
                                onClick={() => copyToClipboard(documents.personalStatement, '个人陈述')}
                                variant="outline"
                                size="sm"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                复制
                              </Button>
                              <Button
                                onClick={() => downloadDocument(documents.personalStatement, 'Personal_Statement')}
                                variant="outline"
                                size="sm"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                下载
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <Textarea
                        placeholder="点击生成按钮创建个人陈述..."
                        value={documents.personalStatement}
                        onChange={(e) => setDocuments(prev => ({ ...prev, personalStatement: e.target.value }))}
                        rows={20}
                        className="font-mono text-sm"
                      />
                    </TabsContent>

                    <TabsContent value="resume" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Resume/CV</h3>
                        <div className="flex gap-2">
                          <Button
                            onClick={generateResume}
                            disabled={loading}
                            size="sm"
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            生成
                          </Button>
                          {documents.resume && (
                            <>
                              <Button
                                onClick={() => copyToClipboard(documents.resume, '简历')}
                                variant="outline"
                                size="sm"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                复制
                              </Button>
                              <Button
                                onClick={() => downloadDocument(documents.resume, 'Resume')}
                                variant="outline"
                                size="sm"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                下载
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <Textarea
                        placeholder="点击生成按钮创建简历..."
                        value={documents.resume}
                        onChange={(e) => setDocuments(prev => ({ ...prev, resume: e.target.value }))}
                        rows={20}
                        className="font-mono text-sm"
                      />
                    </TabsContent>

                    <TabsContent value="research-plan" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Research Plan</h3>
                        <div className="flex gap-2">
                          <Button
                            onClick={generateResearchPlan}
                            disabled={loading}
                            size="sm"
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            生成
                          </Button>
                          {documents.researchPlan && (
                            <>
                              <Button
                                onClick={() => copyToClipboard(documents.researchPlan, '研究计划')}
                                variant="outline"
                                size="sm"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                复制
                              </Button>
                              <Button
                                onClick={() => downloadDocument(documents.researchPlan, 'Research_Plan')}
                                variant="outline"
                                size="sm"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                下载
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <Textarea
                        placeholder="点击生成按钮创建研究计划..."
                        value={documents.researchPlan}
                        onChange={(e) => setDocuments(prev => ({ ...prev, researchPlan: e.target.value }))}
                        rows={20}
                        className="font-mono text-sm"
                      />
                    </TabsContent>
                  </Tabs>

                  <Separator className="my-6" />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lightbulb className="h-4 w-4" />
                      AI生成的内容仅供参考，请根据实际情况进行修改
                    </div>
                    <Button onClick={saveDocuments} disabled={!documents.personalStatement && !documents.resume && !documents.researchPlan}>
                      <Save className="h-4 w-4 mr-2" />
                      保存所有材料
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentGenerator;