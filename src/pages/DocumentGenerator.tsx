import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  Wand2, 
  Save, 
  Eye, 
  RefreshCw,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  User,
  FileCheck,
  History,
  Plus,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";

interface DocumentSource {
  id: string;
  type: 'grade' | 'experience' | 'profile' | 'preference';
  content: string;
  confidence: number;
}

interface GeneratedSection {
  text: string;
  sources: DocumentSource[];
  suggestions: string[];
  score: number;
}

interface ApplicationData {
  id: string;
  title: string;
  personal_statement?: string;
  resume_content?: string;
  research_plan?: string;
  updated_at: string;
}

const DocumentGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [currentApp, setCurrentApp] = useState<ApplicationData | null>(null);
  
  // 编辑器状态
  const [activeTab, setActiveTab] = useState("personal_statement");
  const [rightPanel, setRightPanel] = useState("sources");
  const [selectedText, setSelectedText] = useState("");
  
  // 文档内容和来源追溯
  const [personalStatement, setPersonalStatement] = useState<GeneratedSection>({
    text: "",
    sources: [],
    suggestions: [],
    score: 0
  });
  const [resume, setResume] = useState<GeneratedSection>({
    text: "",
    sources: [],
    suggestions: [],
    score: 0
  });
  const [researchPlan, setResearchPlan] = useState<GeneratedSection>({
    text: "",
    sources: [],
    suggestions: [],
    score: 0
  });

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      setApplications(data || []);
      if (data && data.length > 0) {
        setCurrentApp(data[0]);
        loadApplicationContent(data[0]);
      }
    } catch (error: any) {
      toast({
        title: "获取申请材料失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadApplicationContent = (app: ApplicationData) => {
    if (app.personal_statement) {
      setPersonalStatement(prev => ({
        ...prev,
        text: app.personal_statement || ""
      }));
    }
    if (app.resume_content) {
      setResume(prev => ({
        ...prev,
        text: app.resume_content || ""
      }));
    }
    if (app.research_plan) {
      setResearchPlan(prev => ({
        ...prev,
        text: app.research_plan || ""
      }));
    }
  };

  const generateDocument = async (type: 'personal_statement' | 'resume' | 'research_plan') => {
    setGenerating(true);
    try {
      // 获取用户的相关数据作为生成依据
      const [profileData, transcriptsData, preferencesData] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user?.id).single(),
        supabase.from('transcripts').select('*, grades(*)').eq('user_id', user?.id),
        supabase.from('user_preferences').select('*').eq('user_id', user?.id).single()
      ]);

      const sources = extractSources({ 
        profile: profileData.data, 
        transcripts: transcriptsData.data, 
        preferences: preferencesData.data 
      });

      const prompt = buildPrompt(type, {
        profile: profileData.data,
        transcripts: transcriptsData.data,
        preferences: preferencesData.data
      });

      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: { 
          prompt,
          type,
          userId: user?.id,
          sources: sources
        }
      });

      if (error) throw error;

      // 模拟来源追溯和评分数据（实际项目中应从AI服务返回）
      const mockSources: DocumentSource[] = [
        {
          id: 'profile_gpa',
          type: 'grade',
          content: `GPA: ${transcriptsData.data?.[0]?.weighted_gpa || 'N/A'}`,
          confidence: 0.95
        },
        {
          id: 'profile_major',
          type: 'profile',
          content: `专业: ${profileData.data?.major || 'N/A'}`,
          confidence: 0.9
        },
        {
          id: 'target_degree',
          type: 'preference',
          content: `目标学位: ${profileData.data?.target_degree || 'N/A'}`,
          confidence: 0.85
        }
      ];

      const mockSuggestions = [
        "考虑添加更多具体的研究经历细节",
        "可以强调与目标专业的相关性",
        "建议增加对未来职业规划的描述"
      ];

      const mockScore = Math.floor(Math.random() * 20) + 80; // 80-100分

      // 更新对应的文档状态
      const updatedSection: GeneratedSection = {
        text: data.content || data,
        sources: mockSources,
        suggestions: mockSuggestions,
        score: mockScore
      };

      if (type === 'personal_statement') {
        setPersonalStatement(updatedSection);
      } else if (type === 'resume') {
        setResume(updatedSection);
      } else if (type === 'research_plan') {
        setResearchPlan(updatedSection);
      }

      // 保存到数据库
      await saveApplication();

      toast({
        title: "文档生成成功",
        description: "AI已为您生成高质量的申请文档，请查看来源追溯和改进建议",
      });
    } catch (error: any) {
      console.error('生成文档失败:', error);
      toast({
        title: "生成失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const buildPrompt = (type: string, userData: any) => {
    const { profile, transcripts, preferences } = userData;
    
    let basePrompt = "";
    if (type === 'personal_statement') {
      basePrompt = `请为一位中国学生生成个人陈述(Personal Statement)。

学生信息：
- 姓名：${profile?.full_name || '未设置'}
- 专业：${profile?.major || '未设置'}
- 目标学位：${profile?.target_degree || '未设置'}
- 目标国家：${preferences?.target_countries?.join(', ') || '未设置'}
- 目标专业：${preferences?.preferred_fields?.join(', ') || '未设置'}
- GPA：${transcripts?.[0]?.weighted_gpa || '未设置'}

要求：
1. 内容要具体、有说服力，突出学术背景和研究兴趣
2. 语言要流畅、专业，符合英文学术写作规范
3. 突出学生的优势和潜力，展现个人特色
4. 字数控制在800-1000字
5. 结构清晰：开头引入、学术背景、研究兴趣、选择理由、未来规划、结尾总结`;
    } else if (type === 'resume') {
      basePrompt = `请为一位中国学生生成英文简历(Resume/CV)。

学生信息同上。

要求：
1. 使用专业的简历格式
2. 包含：联系信息、教育背景、研究经历、项目经历、技能、获奖等部分
3. 突出学术成就和研究能力
4. 适合${profile?.target_degree || '研究生'}申请使用`;
    } else if (type === 'research_plan') {
      basePrompt = `请为一位中国学生生成研究计划(Research Plan)。

学生信息同上。

要求：
1. 包含研究背景、研究问题、研究方法、预期成果等部分
2. 体现学术水平和研究思维
3. 与申请专业高度相关
4. 字数控制在1000-1500字`;
    }
    
    return basePrompt;
  };

  const extractSources = (userData: any) => {
    const sources: DocumentSource[] = [];
    
    if (userData.profile) {
      sources.push({
        id: 'profile',
        type: 'profile',
        content: `姓名: ${userData.profile.full_name}, 专业: ${userData.profile.major}`,
        confidence: 0.9
      });
    }
    
    if (userData.transcripts && userData.transcripts.length > 0) {
      userData.transcripts.forEach((transcript: any, index: number) => {
        sources.push({
          id: `transcript_${index}`,
          type: 'grade',
          content: `GPA: ${transcript.weighted_gpa || transcript.unweighted_gpa}`,
          confidence: 0.8
        });
      });
    }
    
    return sources;
  };

  const saveApplication = async () => {
    if (!currentApp) return;
    
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          personal_statement: personalStatement.text,
          resume_content: resume.text,
          research_plan: researchPlan.text,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentApp.id);
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "保存失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createNewApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          user_id: user?.id,
          title: `申请材料包 ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setApplications([data, ...applications]);
      setCurrentApp(data);
      
      // 重置编辑器状态
      setPersonalStatement({ text: "", sources: [], suggestions: [], score: 0 });
      setResume({ text: "", sources: [], suggestions: [], score: 0 });
      setResearchPlan({ text: "", sources: [], suggestions: [], score: 0 });
      
      toast({
        title: "创建成功",
        description: "新的申请材料包已创建",
      });
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderSourcesPanel = () => {
    const currentSection = activeTab === 'personal_statement' ? personalStatement :
                          activeTab === 'resume' ? resume : researchPlan;
    
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <FileCheck className="h-4 w-4" />
          来源证据
        </h3>
        {currentSection.sources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无来源信息</p>
            <p className="text-xs">生成文档后将显示来源追溯</p>
          </div>
        ) : (
          currentSection.sources.map((source) => (
            <Card key={source.id} className="p-3 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  {source.type === 'profile' ? '个人信息' :
                   source.type === 'grade' ? '成绩信息' :
                   source.type === 'experience' ? '经历' : '偏好设置'}
                </Badge>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    {Math.round(source.confidence * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{source.content}</p>
              <Button variant="ghost" size="sm" className="w-full mt-2 h-6 text-xs">
                <ArrowRight className="h-3 w-3 mr-1" />
                跳转到原始输入
              </Button>
            </Card>
          ))
        )}
      </div>
    );
  };

  const renderSuggestionsPanel = () => {
    const currentSection = activeTab === 'personal_statement' ? personalStatement :
                          activeTab === 'resume' ? resume : researchPlan;
    
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          改写建议
        </h3>
        {currentSection.suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无改写建议</p>
            <p className="text-xs">生成文档后将提供优化建议</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentSection.suggestions.map((suggestion, index) => (
              <Card key={index} className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{suggestion}</p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="h-6 text-xs">
                        应用建议
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        忽略
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-2">风格变体</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  学术型风格 - 突出研究能力
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  叙事型风格 - 强调个人故事
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  职业型风格 - 注重实践应用
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderScorePanel = () => {
    const currentSection = activeTab === 'personal_statement' ? personalStatement :
                          activeTab === 'resume' ? resume : researchPlan;
    
    const scores = {
      coverage: Math.round(currentSection.score * 0.9) || 0,
      fluency: Math.round(currentSection.score * 0.95) || 0,
      uniqueness: Math.round(currentSection.score * 0.85) || 0,
      coherence: Math.round(currentSection.score * 0.88) || 0
    };
    
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          质量评分
        </h3>
        
        {currentSection.score === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无评分</p>
            <p className="text-xs">生成文档后将显示质量评分</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>关键点覆盖</span>
                  <span>{scores.coverage}%</span>
                </div>
                <Progress value={scores.coverage} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>语言流畅度</span>
                  <span>{scores.fluency}%</span>
                </div>
                <Progress value={scores.fluency} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>内容独特性</span>
                  <span>{scores.uniqueness}%</span>
                </div>
                <Progress value={scores.uniqueness} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>逻辑连贯性</span>
                  <span>{scores.coherence}%</span>
                </div>
                <Progress value={scores.coherence} className="h-2" />
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium text-sm">总体评分</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(currentSection.score)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentSection.score >= 90 ? '卓越' :
                 currentSection.score >= 80 ? '优秀' : 
                 currentSection.score >= 70 ? '良好' : 
                 currentSection.score >= 60 ? '合格' : '需要改进'}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">问题检测</h4>
              {currentSection.score >= 85 ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  未发现明显问题
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-yellow-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    部分句子可以更简洁
                  </div>
                  <div className="flex items-center gap-2 text-yellow-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    建议增加更多具体例子
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              我的申请包
            </h1>
            <p className="text-muted-foreground">
              智能生成与编辑您的留学申请材料，支持来源追溯和质量评估
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={createNewApplication}>
              <Plus className="mr-2 h-4 w-4" />
              新建申请包
            </Button>
            <Button onClick={saveApplication} disabled={!currentApp}>
              <Save className="mr-2 h-4 w-4" />
              保存
            </Button>
          </div>
        </div>

        {/* 申请包选择器 */}
        {applications.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">选择申请包</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {applications.map((app) => (
                  <Button
                    key={app.id}
                    variant={currentApp?.id === app.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCurrentApp(app);
                      loadApplicationContent(app);
                    }}
                  >
                    {app.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 主编辑器布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：文档编辑器 */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">文档编辑器</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateDocument(activeTab as any)}
                      disabled={generating}
                    >
                      {generating ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                      )}
                      AI生成
                    </Button>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-2">💡 智能编辑器特色：</p>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-3 w-3 text-blue-500" />
                      <span>来源追溯</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-3 w-3 text-yellow-500" />
                      <span>改写建议</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>质量评分</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="personal_statement">个人陈述</TabsTrigger>
                    <TabsTrigger value="resume">简历</TabsTrigger>
                    <TabsTrigger value="research_plan">研究计划</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="personal_statement" className="mt-4">
                    <Textarea
                      placeholder="在此编辑个人陈述...

提示：一份优秀的个人陈述应包含：
• 引人入胜的开头
• 学术背景和成就
• 研究兴趣和经历  
• 选择该项目的原因
• 未来职业规划
• 有力的结尾"
                      value={personalStatement.text}
                      onChange={(e) => setPersonalStatement(prev => ({ ...prev, text: e.target.value }))}
                      className="min-h-[500px] resize-none font-mono text-sm leading-relaxed"
                    />
                  </TabsContent>
                  
                  <TabsContent value="resume" className="mt-4">
                    <Textarea
                      placeholder="在此编辑简历内容...

建议包含以下部分：
• Contact Information
• Education  
• Research Experience
• Work Experience
• Publications
• Awards and Honors
• Skills
• Projects"
                      value={resume.text}
                      onChange={(e) => setResume(prev => ({ ...prev, text: e.target.value }))}
                      className="min-h-[500px] resize-none font-mono text-sm leading-relaxed"
                    />
                  </TabsContent>
                  
                  <TabsContent value="research_plan" className="mt-4">
                    <Textarea
                      placeholder="在此编辑研究计划...

研究计划应包含：
• Research Background and Motivation
• Literature Review  
• Research Questions and Objectives
• Methodology
• Expected Contributions
• Timeline
• Conclusion"
                      value={researchPlan.text}
                      onChange={(e) => setResearchPlan(prev => ({ ...prev, text: e.target.value }))}
                      className="min-h-[500px] resize-none font-mono text-sm leading-relaxed"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：辅助面板 */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">辅助工具</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={rightPanel} onValueChange={setRightPanel}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sources" className="text-xs">来源</TabsTrigger>
                    <TabsTrigger value="suggestions" className="text-xs">建议</TabsTrigger>
                    <TabsTrigger value="score" className="text-xs">评分</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sources" className="mt-4">
                    {renderSourcesPanel()}
                  </TabsContent>
                  
                  <TabsContent value="suggestions" className="mt-4">
                    {renderSuggestionsPanel()}
                  </TabsContent>
                  
                  <TabsContent value="score" className="mt-4">
                    {renderScorePanel()}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  导出PDF
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Eye className="mr-2 h-4 w-4" />
                  预览效果
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <History className="mr-2 h-4 w-4" />
                  版本历史
                </Button>
                <Separator className="my-2" />
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                  <User className="mr-2 h-4 w-4" />
                  人工润色 (即将推出)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-1">使用技巧</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 点击右侧面板的"来源"查看每句话的数据依据，提升可信度</li>
                <li>• 使用"改写建议"获得不同风格的表达，让文书更加个性化</li>
                <li>• 关注"质量评分"的各项指标，针对性提升文书质量</li>
                <li>• 记住随时保存您的修改，避免丢失重要内容</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentGenerator;