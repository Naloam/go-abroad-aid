import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Save, Calculator } from "lucide-react";

interface Grade {
  id?: string;
  semester: string;
  courseName: string;
  courseCode: string;
  credits: number;
  grade: string;
  gpaPoints: number;
  courseType: string;
}

interface GpaScale {
  name: string;
  scale: { [key: string]: number };
}

const gpaScales: GpaScale[] = [
  {
    name: "4.0标准制",
    scale: {
      "A+": 4.0, "A": 4.0, "A-": 3.7,
      "B+": 3.3, "B": 3.0, "B-": 2.7,
      "C+": 2.3, "C": 2.0, "C-": 1.7,
      "D+": 1.3, "D": 1.0, "F": 0.0
    }
  },
  {
    name: "百分制转4.0",
    scale: {
      "90-100": 4.0, "85-89": 3.7, "82-84": 3.3,
      "78-81": 3.0, "75-77": 2.7, "72-74": 2.3,
      "68-71": 2.0, "64-67": 1.7, "60-63": 1.0, "0-59": 0.0
    }
  }
];

const GpaCalculator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transcriptName, setTranscriptName] = useState("我的成绩单");
  const [selectedScale, setSelectedScale] = useState("4.0标准制");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [currentTranscriptId, setCurrentTranscriptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 计算GPA的函数
  const calculateGPA = (gradesList: Grade[]) => {
    if (gradesList.length === 0) return { totalCredits: 0, weightedGPA: 0, unweightedGPA: 0 };
    
    const totalCredits = gradesList.reduce((sum, grade) => sum + grade.credits, 0);
    const totalPoints = gradesList.reduce((sum, grade) => sum + (grade.gpaPoints * grade.credits), 0);
    const weightedGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
    
    const unweightedPoints = gradesList.reduce((sum, grade) => sum + grade.gpaPoints, 0);
    const unweightedGPA = gradesList.length > 0 ? unweightedPoints / gradesList.length : 0;
    
    return {
      totalCredits,
      weightedGPA: Number(weightedGPA.toFixed(2)),
      unweightedGPA: Number(unweightedGPA.toFixed(2))
    };
  };

  // 从百分制成绩转换为GPA点数
  const convertPercentToGPA = (grade: string): number => {
    const numGrade = parseInt(grade);
    if (isNaN(numGrade)) {
      // 如果不是数字，尝试从字母等级转换
      const scale = gpaScales.find(s => s.name === selectedScale)?.scale || {};
      return scale[grade] || 0;
    }
    
    if (numGrade >= 90) return 4.0;
    if (numGrade >= 85) return 3.7;
    if (numGrade >= 82) return 3.3;
    if (numGrade >= 78) return 3.0;
    if (numGrade >= 75) return 2.7;
    if (numGrade >= 72) return 2.3;
    if (numGrade >= 68) return 2.0;
    if (numGrade >= 64) return 1.7;
    if (numGrade >= 60) return 1.0;
    return 0.0;
  };

  // 添加新的成绩记录
  const addGrade = () => {
    const newGrade: Grade = {
      semester: "",
      courseName: "",
      courseCode: "",
      credits: 0,
      grade: "",
      gpaPoints: 0,
      courseType: "regular"
    };
    setGrades([...grades, newGrade]);
  };

  // 更新成绩记录
  const updateGrade = (index: number, field: keyof Grade, value: string | number) => {
    const updatedGrades = [...grades];
    updatedGrades[index] = { ...updatedGrades[index], [field]: value };
    
    // 如果更新的是成绩，自动计算GPA点数
    if (field === 'grade') {
      updatedGrades[index].gpaPoints = convertPercentToGPA(value as string);
    }
    
    setGrades(updatedGrades);
  };

  // 删除成绩记录
  const removeGrade = (index: number) => {
    setGrades(grades.filter((_, i) => i !== index));
  };

  // 保存成绩单到数据库
  const saveTranscript = async () => {
    if (!user || grades.length === 0) {
      toast({
        title: "保存失败",
        description: "请先添加成绩记录",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { totalCredits, weightedGPA, unweightedGPA } = calculateGPA(grades);
      
      let transcriptId = currentTranscriptId;
      
      if (!transcriptId) {
        // 创建新成绩单
        const { data: transcript, error: transcriptError } = await supabase
          .from('transcripts')
          .insert({
            user_id: user.id,
            name: transcriptName,
            total_credits: totalCredits,
            weighted_gpa: weightedGPA,
            unweighted_gpa: unweightedGPA,
            gpa_scale: selectedScale
          })
          .select()
          .single();

        if (transcriptError) throw transcriptError;
        transcriptId = transcript.id;
        setCurrentTranscriptId(transcriptId);
      } else {
        // 更新现有成绩单
        const { error: updateError } = await supabase
          .from('transcripts')
          .update({
            name: transcriptName,
            total_credits: totalCredits,
            weighted_gpa: weightedGPA,
            unweighted_gpa: unweightedGPA,
            gpa_scale: selectedScale
          })
          .eq('id', transcriptId);

        if (updateError) throw updateError;

        // 删除旧的成绩记录
        await supabase.from('grades').delete().eq('transcript_id', transcriptId);
      }

      // 插入成绩记录
      const gradeRecords = grades.map(grade => ({
        transcript_id: transcriptId,
        semester: grade.semester,
        course_name: grade.courseName,
        course_code: grade.courseCode,
        credits: grade.credits,
        grade: grade.grade,
        gpa_points: grade.gpaPoints,
        course_type: grade.courseType
      }));

      const { error: gradesError } = await supabase
        .from('grades')
        .insert(gradeRecords);

      if (gradesError) throw gradesError;

      toast({
        title: "保存成功",
        description: "成绩单已保存到您的账户",
      });
    } catch (error) {
      console.error('保存成绩单失败:', error);
      toast({
        title: "保存失败",
        description: "请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = calculateGPA(grades);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Calculator className="h-8 w-8 text-primary" />
              GPA计算器
            </h1>
            <p className="text-muted-foreground">
              录入您的成绩信息，自动计算加权和非加权GPA
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：成绩录入 */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>成绩单设置</CardTitle>
                  <CardDescription>设置成绩单名称和GPA换算标准</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="transcriptName">成绩单名称</Label>
                    <Input
                      id="transcriptName"
                      value={transcriptName}
                      onChange={(e) => setTranscriptName(e.target.value)}
                      placeholder="例如：2023年春季学期"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gpaScale">GPA换算标准</Label>
                    <Select value={selectedScale} onValueChange={setSelectedScale}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gpaScales.map((scale) => (
                          <SelectItem key={scale.name} value={scale.name}>
                            {scale.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>成绩录入</CardTitle>
                    <CardDescription>添加您的课程成绩信息</CardDescription>
                  </div>
                  <Button onClick={addGrade} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    添加课程
                  </Button>
                </CardHeader>
                <CardContent>
                  {grades.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>还没有添加任何课程</p>
                      <p className="text-sm">点击"添加课程"开始录入成绩</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {grades.map((grade, index) => (
                        <Card key={index} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <Label htmlFor={`semester-${index}`}>学期</Label>
                              <Input
                                id={`semester-${index}`}
                                placeholder="2023春"
                                value={grade.semester}
                                onChange={(e) => updateGrade(index, 'semester', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`courseName-${index}`}>课程名称</Label>
                              <Input
                                id={`courseName-${index}`}
                                placeholder="高等数学"
                                value={grade.courseName}
                                onChange={(e) => updateGrade(index, 'courseName', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`courseCode-${index}`}>课程代码</Label>
                              <Input
                                id={`courseCode-${index}`}
                                placeholder="MATH101"
                                value={grade.courseCode}
                                onChange={(e) => updateGrade(index, 'courseCode', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`credits-${index}`}>学分</Label>
                              <Input
                                id={`credits-${index}`}
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="3"
                                value={grade.credits || ''}
                                onChange={(e) => updateGrade(index, 'credits', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`grade-${index}`}>成绩</Label>
                              <Input
                                id={`grade-${index}`}
                                placeholder="85 或 A-"
                                value={grade.grade}
                                onChange={(e) => updateGrade(index, 'grade', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>GPA点数</Label>
                              <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted">
                                <span className="text-sm font-medium">
                                  {grade.gpaPoints.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`courseType-${index}`}>课程类型</Label>
                              <Select 
                                value={grade.courseType} 
                                onValueChange={(value) => updateGrade(index, 'courseType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="regular">普通</SelectItem>
                                  <SelectItem value="honors">荣誉</SelectItem>
                                  <SelectItem value="ap">AP</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeGrade(index)}
                                className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 右侧：GPA统计 */}
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>GPA统计</CardTitle>
                  <CardDescription>当前成绩的GPA计算结果</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {stats.weightedGPA.toFixed(2)}
                    </div>
                    <Badge variant="secondary">加权GPA</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">总学分</span>
                      <span className="font-medium">{stats.totalCredits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">非加权GPA</span>
                      <span className="font-medium">{stats.unweightedGPA.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">课程数量</span>
                      <span className="font-medium">{grades.length}</span>
                    </div>
                  </div>

                  <Separator />

                  <Button 
                    onClick={saveTranscript} 
                    className="w-full" 
                    disabled={loading || grades.length === 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? '保存中...' : '保存成绩单'}
                  </Button>
                </CardContent>
              </Card>

              {/* GPA换算参考 */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-sm">GPA换算参考</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs space-y-1">
                    <div className="grid grid-cols-2 gap-2 font-medium border-b pb-1 mb-2">
                      <span>成绩</span>
                      <span>GPA</span>
                    </div>
                    {Object.entries(gpaScales.find(s => s.name === selectedScale)?.scale || {}).slice(0, 6).map(([grade, gpa]) => (
                      <div key={grade} className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">{grade}</span>
                        <span>{gpa.toFixed(1)}</span>
                      </div>
                    ))}
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

export default GpaCalculator;