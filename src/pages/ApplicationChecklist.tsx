import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare, Plus, Calendar, FileText, School, AlertTriangle, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ChecklistItem {
  id: string;
  university_name: string;
  program_name: string;
  item_type: string;
  item_name: string;
  is_completed: boolean;
  due_date?: string;
  notes?: string;
}

const ITEM_TYPES = [
  { value: 'transcript', label: '成绩单', icon: FileText },
  { value: 'essay', label: '文书材料', icon: FileText },
  { value: 'recommendation', label: '推荐信', icon: FileText },
  { value: 'test_score', label: '标化成绩', icon: FileText },
  { value: 'other', label: '其他材料', icon: FileText }
];

const ApplicationChecklist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [formData, setFormData] = useState({
    university_name: "",
    program_name: "",
    item_type: "essay",
    item_name: "",
    due_date: "",
    notes: ""
  });

  useEffect(() => {
    if (user) {
      fetchChecklist();
    }
  }, [user]);

  const fetchChecklist = async () => {
    try {
      const { data, error } = await supabase
        .from('application_checklist')
        .select('*')
        .eq('user_id', user?.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('获取申请清单失败:', error);
      toast({
        title: "获取失败",
        description: "无法加载申请清单",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.university_name || !formData.item_name) {
      toast({
        title: "请填写必填项",
        description: "学校名称和材料名称为必填项",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('application_checklist')
        .insert({
          ...formData,
          due_date: formData.due_date || null, // Convert empty string to null
          user_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "添加成功",
        description: "申请材料已添加到清单",
      });

      setFormData({
        university_name: "",
        program_name: "",
        item_type: "essay",
        item_name: "",
        due_date: "",
        notes: ""
      });
      setShowAddForm(false);
      fetchChecklist();
    } catch (error) {
      console.error('添加失败:', error);
      toast({
        title: "添加失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const toggleCompletion = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('application_checklist')
        .update({ is_completed: completed })
        .eq('id', id);

      if (error) throw error;
      fetchChecklist();
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新完成状态",
        variant: "destructive",
      });
    }
  };

  const getTypeConfig = (type: string) => {
    return ITEM_TYPES.find(t => t.value === type) || ITEM_TYPES[0];
  };

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    return differenceInDays(parseISO(dueDate), new Date());
  };

  const getUrgencyBadge = (daysLeft: number | null) => {
    if (daysLeft === null) return null;
    if (daysLeft < 0) return <Badge variant="destructive">已过期</Badge>;
    if (daysLeft < 7) return <Badge variant="destructive">紧急</Badge>;
    if (daysLeft < 14) return <Badge variant="secondary">即将到期</Badge>;
    return null;
  };

  // 按学校分组
  const groupedItems = items.reduce((acc, item) => {
    const key = `${item.university_name} - ${item.program_name || '未指定项目'}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const universities = Array.from(new Set(items.map(item => item.university_name)));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">申请材料清单</h1>
            <p className="text-muted-foreground">管理每个学校的申请材料完成情况</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            添加材料
          </Button>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{items.length}</div>
              <p className="text-sm text-muted-foreground">材料总数</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-500">
                {items.filter(item => item.is_completed).length}
              </div>
              <p className="text-sm text-muted-foreground">已完成</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-500">
                {items.filter(item => !item.is_completed && item.due_date && getDaysUntilDue(item.due_date)! < 7).length}
              </div>
              <p className="text-sm text-muted-foreground">7天内到期</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">
                {Object.keys(groupedItems).length}
              </div>
              <p className="text-sm text-muted-foreground">申请学校</p>
            </CardContent>
          </Card>
        </div>

        {/* 筛选器 */}
        {universities.length > 0 && (
          <Card className="shadow-card mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Label htmlFor="university_filter">按学校筛选:</Label>
                <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="全部学校" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部学校</SelectItem>
                    {universities.map(uni => (
                      <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedUniversity && (
                  <Button variant="outline" onClick={() => setSelectedUniversity("")}>
                    清除筛选
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 添加表单 */}
        {showAddForm && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle>添加申请材料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">学校名称 *</Label>
                  <Input
                    id="university"
                    value={formData.university_name}
                    onChange={(e) => setFormData({...formData, university_name: e.target.value})}
                    placeholder="输入学校名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program">项目名称</Label>
                  <Input
                    id="program"
                    value={formData.program_name}
                    onChange={(e) => setFormData({...formData, program_name: e.target.value})}
                    placeholder="输入项目名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item_type">材料类型</Label>
                  <Select value={formData.item_type} onValueChange={(value) => setFormData({...formData, item_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item_name">材料名称 *</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                    placeholder="如：个人陈述、推荐信等"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="due_date">截止日期</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="添加关于这个材料的备注"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <Button onClick={handleAdd}>添加</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>取消</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 申请清单 */}
        <div className="space-y-6">
          {Object.keys(groupedItems).length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="text-center py-12">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">暂无申请材料</h3>
                <p className="text-muted-foreground mb-4">开始添加您的申请材料来跟踪完成进度</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加第一个材料
                </Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedItems)
              .filter(([university]) => !selectedUniversity || university.includes(selectedUniversity))
              .map(([universityProgram, schoolItems]) => {
                const completedItems = schoolItems.filter(item => item.is_completed).length;
                const completionRate = (completedItems / schoolItems.length) * 100;

                return (
                  <Card key={universityProgram} className="shadow-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <School className="h-6 w-6 text-primary" />
                          <div>
                            <CardTitle className="text-xl">{universityProgram}</CardTitle>
                            <CardDescription>
                              {completedItems} / {schoolItems.length} 项材料已完成
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{completionRate.toFixed(0)}%</div>
                          <Progress value={completionRate} className="w-20 h-2 mt-1" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {schoolItems.map((item) => {
                          const typeConfig = getTypeConfig(item.item_type);
                          const daysLeft = getDaysUntilDue(item.due_date);
                          const urgencyBadge = getUrgencyBadge(daysLeft);
                          const TypeIcon = typeConfig.icon;

                          return (
                            <div
                              key={item.id}
                              className={`flex items-center gap-4 p-4 rounded-lg border ${
                                item.is_completed ? 'bg-green-50 border-green-200' : 'bg-background'
                              }`}
                            >
                              <Checkbox
                                checked={item.is_completed}
                                onCheckedChange={(checked) => toggleCompletion(item.id, checked as boolean)}
                              />
                              
                              <TypeIcon className={`h-5 w-5 ${item.is_completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={`font-medium ${item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {item.item_name}
                                  </h4>
                                  <Badge variant="outline">{typeConfig.label}</Badge>
                                  {urgencyBadge}
                                </div>
                                
                                <div className="text-sm text-muted-foreground">
                                  {item.due_date && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      截止日期: {format(parseISO(item.due_date), 'yyyy年MM月dd日', { locale: zhCN })}
                                      {daysLeft !== null && (
                                        <span className={`ml-2 ${daysLeft < 0 ? 'text-red-500' : daysLeft < 7 ? 'text-orange-500' : 'text-green-500'}`}>
                                          ({daysLeft < 0 ? `已过期 ${Math.abs(daysLeft)} 天` : `还有 ${daysLeft} 天`})
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                                
                                {item.notes && (
                                  <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                                    {item.notes}
                                  </div>
                                )}
                              </div>
                              
                              {item.is_completed && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationChecklist;