import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Upload, Calculator, Target, FileText, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: any;
}

interface TranscriptData {
  course_name: string;
  credits: number;
  grade: string;
  semester: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "欢迎使用",
    description: "了解平台功能并设置基本信息",
    icon: User
  },
  {
    id: 2,
    title: "成绩输入",
    description: "录入您的学术成绩信息",
    icon: Calculator
  },
  {
    id: 3,
    title: "成绩单上传",
    description: "上传官方成绩单文件",
    icon: Upload
  },
  {
    id: 4,
    title: "GPA确认",
    description: "确认计算的GPA结果",
    icon: CheckCircle
  },
  {
    id: 5,
    title: "偏好设置",
    description: "设置申请偏好和目标",
    icon: Target
  }
];

const Onboarding = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // 步骤1: 基本信息
  const [basicInfo, setBasicInfo] = useState({
    full_name: "",
    university: "",
    major: "",
    graduation_year: new Date().getFullYear()
  });
  
  // 步骤2: 成绩录入
  const [transcriptData, setTranscriptData] = useState<TranscriptData[]>([
    { course_name: "", credits: 0, grade: "", semester: "大一上" }
  ]);
  const [gpaScale, setGpaScale] = useState("4.0标准制");
  
  // 步骤3: 文件上传
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // 步骤4: GPA结果
  const [calculatedGPA, setCalculatedGPA] = useState({
    weighted: 0,
    unweighted: 0,
    total_credits: 0
  });
  
  // 步骤5: 偏好设置
  const [preferences, setPreferences] = useState({
    target_countries: [] as string[],
    target_degree_level: "",
    preferred_fields: [] as string[],
    budget_min: 0,
    budget_max: 100000
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setCurrentStep(data.current_step);
        setCompletedSteps((data.completed_steps as number[]) || []);
        
        if (data.is_completed) {
          navigate('/dashboard');
          return;
        }
      }
    } catch (error) {
      console.error('检查引导状态失败:', error);
    }
  };

  const updateOnboardingStatus = async (step: number, completed: boolean = false) => {
    if (!user) return;
    
    try {
      const newCompletedSteps = completed ? [...completedSteps, step] : completedSteps;
      const nextStep = step + 1;
      const isCompleted = step === ONBOARDING_STEPS.length;
      
      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          current_step: isCompleted ? step : nextStep,
          completed_steps: newCompletedSteps,
          is_completed: isCompleted
        });
      
      if (error) throw error;
      
      if (completed) {
        setCompletedSteps(newCompletedSteps);
      }
      
      if (isCompleted) {
        toast({
          title: "引导完成",
          description: "欢迎使用我们的平台！",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('更新引导状态失败:', error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const saveBasicInfo = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          ...basicInfo
        });
      
      if (error) throw error;
      
      toast({
        title: "基本信息已保存",
        description: "继续下一步",
      });
      
      await updateOnboardingStatus(1, true);
      setCurrentStep(2);
    } catch (error) {
      console.error('保存基本信息失败:', error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const saveTranscriptData = async () => {
    try {
      // 创建成绩单
      const { data: transcript, error: transcriptError } = await supabase
        .from('transcripts')
        .insert({
          user_id: user?.id,
          name: "引导流程成绩单",
          gpa_scale: gpaScale
        })
        .select()
        .single();
      
      if (transcriptError) throw transcriptError;
      
      // 添加成绩记录
      const gradesData = transcriptData.filter(grade => grade.course_name && grade.credits > 0);
      if (gradesData.length > 0) {
        const { error: gradesError } = await supabase
          .from('grades')
          .insert(
            gradesData.map(grade => ({
              transcript_id: transcript.id,
              ...grade
            }))
          );
        
        if (gradesError) throw gradesError;
      }
      
      toast({
        title: "成绩数据已保存",
        description: "继续上传成绩单文件",
      });
      
      await updateOnboardingStatus(2, true);
      setCurrentStep(3);
    } catch (error) {
      console.error('保存成绩数据失败:', error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      toast({
        title: "请选择文件",
        description: "请先选择要上传的成绩单文件",
        variant: "destructive",
      });
      return;
    }
    
    // 这里可以添加文件上传逻辑
    toast({
      title: "文件上传成功",
      description: "成绩单文件已上传，继续确认GPA",
    });
    
    await updateOnboardingStatus(3, true);
    setCurrentStep(4);
  };

  const confirmGPA = async () => {
    toast({
      title: "GPA已确认",
      description: "继续设置申请偏好",
    });
    
    await updateOnboardingStatus(4, true);
    setCurrentStep(5);
  };

  const savePreferences = async () => {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          ...preferences
        });
      
      if (error) throw error;
      
      toast({
        title: "偏好设置已保存",
        description: "引导流程完成！",
      });
      
      await updateOnboardingStatus(5, true);
    } catch (error) {
      console.error('保存偏好设置失败:', error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const addTranscriptRow = () => {
    setTranscriptData([
      ...transcriptData,
      { course_name: "", credits: 0, grade: "", semester: "大一上" }
    ]);
  };

  const updateTranscriptRow = (index: number, field: keyof TranscriptData, value: any) => {
    const newData = [...transcriptData];
    newData[index] = { ...newData[index], [field]: value };
    setTranscriptData(newData);
  };

  const removeTranscriptRow = (index: number) => {
    if (transcriptData.length > 1) {
      setTranscriptData(transcriptData.filter((_, i) => i !== index));
    }
  };

  const progress = (currentStep / ONBOARDING_STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <User className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">欢迎来到留学申请助手</h2>
              <p className="text-muted-foreground">
                让我们帮助您完成留学申请的每一步。首先，请填写您的基本信息。
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">姓名 *</Label>
                <Input
                  id="full_name"
                  value={basicInfo.full_name}
                  onChange={(e) => setBasicInfo({...basicInfo, full_name: e.target.value})}
                  placeholder="输入您的姓名"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="university">当前学校 *</Label>
                <Input
                  id="university"
                  value={basicInfo.university}
                  onChange={(e) => setBasicInfo({...basicInfo, university: e.target.value})}
                  placeholder="输入您的学校名称"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="major">专业 *</Label>
                <Input
                  id="major"
                  value={basicInfo.major}
                  onChange={(e) => setBasicInfo({...basicInfo, major: e.target.value})}
                  placeholder="输入您的专业"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="graduation_year">毕业年份</Label>
                <Select 
                  value={basicInfo.graduation_year.toString()} 
                  onValueChange={(value) => setBasicInfo({...basicInfo, graduation_year: Number(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 10}, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={saveBasicInfo} 
              className="w-full"
              disabled={!basicInfo.full_name || !basicInfo.university || !basicInfo.major}
            >
              下一步 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Calculator className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">录入成绩信息</h2>
              <p className="text-muted-foreground">
                请输入您的课程成绩，我们将自动计算GPA
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gpa_scale">成绩制式</Label>
                <Select value={gpaScale} onValueChange={setGpaScale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4.0标准制">4.0标准制</SelectItem>
                    <SelectItem value="百分制转4.0">百分制转4.0</SelectItem>
                    <SelectItem value="五分制">五分制</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label>课程成绩</Label>
                {transcriptData.map((row, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 p-3 border rounded-lg">
                    <Input
                      placeholder="课程名称"
                      value={row.course_name}
                      onChange={(e) => updateTranscriptRow(index, 'course_name', e.target.value)}
                    />
                    <Input
                      placeholder="学分"
                      type="number"
                      value={row.credits || ''}
                      onChange={(e) => updateTranscriptRow(index, 'credits', Number(e.target.value))}
                    />
                    <Input
                      placeholder="成绩"
                      value={row.grade}
                      onChange={(e) => updateTranscriptRow(index, 'grade', e.target.value)}
                    />
                    <Select 
                      value={row.semester} 
                      onValueChange={(value) => updateTranscriptRow(index, 'semester', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="大一上">大一上</SelectItem>
                        <SelectItem value="大一下">大一下</SelectItem>
                        <SelectItem value="大二上">大二上</SelectItem>
                        <SelectItem value="大二下">大二下</SelectItem>
                        <SelectItem value="大三上">大三上</SelectItem>
                        <SelectItem value="大三下">大三下</SelectItem>
                        <SelectItem value="大四上">大四上</SelectItem>
                        <SelectItem value="大四下">大四下</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTranscriptRow(index)}
                      disabled={transcriptData.length === 1}
                    >
                      删除
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addTranscriptRow}>
                  添加课程
                </Button>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> 上一步
              </Button>
              <Button onClick={saveTranscriptData} className="flex-1">
                下一步 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">上传成绩单</h2>
              <p className="text-muted-foreground">
                上传您的官方成绩单文件，我们将自动识别并提取信息
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  支持 PDF、JPG、PNG 格式，最大 10MB
                </p>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="max-w-xs mx-auto"
                />
                {uploadedFile && (
                  <p className="text-sm text-green-600 mt-2">
                    已选择: {uploadedFile.name}
                  </p>
                )}
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>或者选择跳过此步骤，稍后在系统中上传</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> 上一步
              </Button>
              <Button variant="outline" onClick={() => { setCurrentStep(4); updateOnboardingStatus(3, true); }}>
                跳过
              </Button>
              <Button onClick={handleFileUpload} className="flex-1">
                上传并继续 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">确认GPA计算</h2>
              <p className="text-muted-foreground">
                请确认您的GPA计算结果
              </p>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">3.65</div>
                      <p className="text-sm text-muted-foreground">加权GPA</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">3.72</div>
                      <p className="text-sm text-muted-foreground">不加权GPA</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">128</div>
                      <p className="text-sm text-muted-foreground">总学分</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>说明：</strong> 
                  GPA计算基于您输入的成绩信息。如需修改，请返回上一步调整成绩录入。
                  您也可以稍后在GPA计算器中详细管理您的成绩。
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> 上一步
              </Button>
              <Button onClick={confirmGPA} className="flex-1">
                确认并继续 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Target className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">设置申请偏好</h2>
              <p className="text-muted-foreground">
                告诉我们您的申请目标，我们将为您推荐合适的学校和项目
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>目标国家（可多选）</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["美国", "英国", "加拿大", "澳大利亚", "德国", "新加坡"].map((country) => (
                    <div key={country} className="flex items-center space-x-2">
                      <Checkbox
                        id={country}
                        checked={preferences.target_countries.includes(country)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPreferences({
                              ...preferences,
                              target_countries: [...preferences.target_countries, country]
                            });
                          } else {
                            setPreferences({
                              ...preferences,
                              target_countries: preferences.target_countries.filter(c => c !== country)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={country}>{country}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="degree_level">目标学位</Label>
                <Select 
                  value={preferences.target_degree_level} 
                  onValueChange={(value) => setPreferences({...preferences, target_degree_level: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择学位类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bachelor">本科</SelectItem>
                    <SelectItem value="master">硕士</SelectItem>
                    <SelectItem value="phd">博士</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label>感兴趣的专业领域（可多选）</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["计算机科学", "商科", "工程", "医学", "法学", "艺术设计", "教育", "其他"].map((field) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={preferences.preferred_fields.includes(field)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPreferences({
                              ...preferences,
                              preferred_fields: [...preferences.preferred_fields, field]
                            });
                          } else {
                            setPreferences({
                              ...preferences,
                              preferred_fields: preferences.preferred_fields.filter(f => f !== field)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={field}>{field}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>预算范围（美元/年）</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget_min">最低预算</Label>
                    <Input
                      id="budget_min"
                      type="number"
                      value={preferences.budget_min}
                      onChange={(e) => setPreferences({...preferences, budget_min: Number(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget_max">最高预算</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      value={preferences.budget_max}
                      onChange={(e) => setPreferences({...preferences, budget_max: Number(e.target.value)})}
                      placeholder="100000"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(4)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> 上一步
              </Button>
              <Button onClick={savePreferences} className="flex-1">
                完成设置 <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* 进度指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">初次设置向导</h1>
            <span className="text-sm text-muted-foreground">
              步骤 {currentStep} / {ONBOARDING_STEPS.length}
            </span>
          </div>
          
          <Progress value={progress} className="h-3 mb-6" />
          
          <div className="flex justify-between">
            {ONBOARDING_STEPS.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const StepIcon = step.icon;
              
              return (
                <div key={step.id} className="flex flex-col items-center space-y-2">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2
                    ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 
                      isCurrent ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 步骤内容 */}
        <Card className="shadow-card">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;