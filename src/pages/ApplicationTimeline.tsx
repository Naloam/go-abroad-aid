import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarIcon, Clock, Plus, AlertTriangle, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";

interface TimelineItem {
  id: string;
  university_name: string;
  program_name: string;
  application_deadline: string;
  early_deadline?: string;
  status: string;
  priority: number;
  notes?: string;
}

const ApplicationTimeline = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    university_name: "",
    program_name: "",
    application_deadline: "",
    early_deadline: "",
    status: "not_started",
    priority: 1,
    notes: ""
  });

  useEffect(() => {
    if (user) {
      fetchTimeline();
    }
  }, [user]);

  const fetchTimeline = async () => {
    try {
      const { data, error } = await supabase
        .from('application_timeline')
        .select('*')
        .eq('user_id', user?.id)
        .order('application_deadline', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('获取申请时间线失败:', error);
      toast({
        title: "获取失败",
        description: "无法加载申请时间线",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.university_name || !formData.program_name || !formData.application_deadline) {
      toast({
        title: "请填写必填项",
        description: "学校名称、项目名称和申请截止日期为必填项",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('application_timeline')
        .insert({
          ...formData,
          user_id: user?.id,
          priority: Number(formData.priority)
        });

      if (error) throw error;

      toast({
        title: "添加成功",
        description: "申请时间线项目已添加",
      });

      setFormData({
        university_name: "",
        program_name: "",
        application_deadline: "",
        early_deadline: "",
        status: "not_started",
        priority: 1,
        notes: ""
      });
      setShowAddForm(false);
      fetchTimeline();
    } catch (error) {
      console.error('添加失败:', error);
      toast({
        title: "添加失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('application_timeline')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchTimeline();
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新申请状态",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      not_started: { label: "未开始", variant: "secondary" as const, color: "bg-gray-500" },
      in_progress: { label: "进行中", variant: "default" as const, color: "bg-blue-500" },
      submitted: { label: "已提交", variant: "default" as const, color: "bg-green-500" },
      completed: { label: "已完成", variant: "default" as const, color: "bg-emerald-500" }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
  };

  const getDaysUntilDeadline = (deadline: string) => {
    return differenceInDays(parseISO(deadline), new Date());
  };

  const getUrgencyIcon = (daysLeft: number) => {
    if (daysLeft < 0) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (daysLeft < 30) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    if (daysLeft < 60) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

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
            <h1 className="text-3xl font-bold text-foreground mb-2">申请时间线</h1>
            <p className="text-muted-foreground">管理您的申请截止日期和进度</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            添加申请
          </Button>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{items.length}</div>
              <p className="text-sm text-muted-foreground">总申请数量</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-500">
                {items.filter(item => getDaysUntilDeadline(item.application_deadline) < 30).length}
              </div>
              <p className="text-sm text-muted-foreground">30天内截止</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-500">
                {items.filter(item => item.status === 'in_progress').length}
              </div>
              <p className="text-sm text-muted-foreground">进行中</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-500">
                {items.filter(item => item.status === 'completed').length}
              </div>
              <p className="text-sm text-muted-foreground">已完成</p>
            </CardContent>
          </Card>
        </div>

        {/* 添加表单 */}
        {showAddForm && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle>添加新申请</CardTitle>
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
                  <Label htmlFor="program">项目名称 *</Label>
                  <Input
                    id="program"
                    value={formData.program_name}
                    onChange={(e) => setFormData({...formData, program_name: e.target.value})}
                    placeholder="输入项目名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">申请截止日期 *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="early_deadline">提前批截止日期</Label>
                  <Input
                    id="early_deadline"
                    type="date"
                    value={formData.early_deadline}
                    onChange={(e) => setFormData({...formData, early_deadline: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">申请状态</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">未开始</SelectItem>
                      <SelectItem value="in_progress">进行中</SelectItem>
                      <SelectItem value="submitted">已提交</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">优先级 (1-5)</Label>
                  <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({...formData, priority: Number(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (最高)</SelectItem>
                      <SelectItem value="2">2 (高)</SelectItem>
                      <SelectItem value="3">3 (中等)</SelectItem>
                      <SelectItem value="4">4 (低)</SelectItem>
                      <SelectItem value="5">5 (最低)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="添加备注信息"
                />
              </div>
              <div className="flex gap-4">
                <Button onClick={handleAdd}>添加</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>取消</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 时间线列表 */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">暂无申请时间线</h3>
                <p className="text-muted-foreground mb-4">开始添加您的申请项目来管理截止日期</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加第一个申请
                </Button>
              </CardContent>
            </Card>
          ) : (
            items.map((item) => {
              const daysLeft = getDaysUntilDeadline(item.application_deadline);
              const statusConfig = getStatusBadge(item.status);
              const urgencyIcon = getUrgencyIcon(daysLeft);

              return (
                <Card key={item.id} className="shadow-card hover:shadow-hover transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {urgencyIcon}
                          <h3 className="text-lg font-semibold">{item.university_name}</h3>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                          <Badge variant="outline">优先级 {item.priority}</Badge>
                        </div>
                        <p className="text-muted-foreground">{item.program_name}</p>
                      </div>
                      <Select value={item.status} onValueChange={(value) => updateStatus(item.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">未开始</SelectItem>
                          <SelectItem value="in_progress">进行中</SelectItem>
                          <SelectItem value="submitted">已提交</SelectItem>
                          <SelectItem value="completed">已完成</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">申请截止</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(item.application_deadline), 'MM月dd日', { locale: zhCN })}
                            <span className={`ml-2 ${daysLeft < 0 ? 'text-red-500' : daysLeft < 30 ? 'text-orange-500' : 'text-green-500'}`}>
                              ({daysLeft < 0 ? `已过期 ${Math.abs(daysLeft)} 天` : `还有 ${daysLeft} 天`})
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      {item.early_deadline && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">提前批截止</p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(item.early_deadline), 'MM月dd日', { locale: zhCN })}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusConfig.color}`}></div>
                        <div>
                          <p className="text-sm font-medium">申请进度</p>
                          <Progress 
                            value={
                              item.status === 'not_started' ? 0 : 
                              item.status === 'in_progress' ? 50 : 
                              item.status === 'submitted' ? 80 : 100
                            } 
                            className="w-24 h-2"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {item.notes && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm">{item.notes}</p>
                      </div>
                    )}
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

export default ApplicationTimeline;