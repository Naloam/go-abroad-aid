import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, Mail, Plus, Calendar, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";

interface RecommendationLetter {
  id: string;
  recommender_name: string;
  recommender_email: string;
  recommender_title?: string;
  relationship: string;
  university_name: string;
  program_name: string;
  status: string;
  request_date?: string;
  submission_deadline?: string;
  notes?: string;
}

const RecommendationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [letters, setLetters] = useState<RecommendationLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    recommender_name: "",
    recommender_email: "",
    recommender_title: "",
    relationship: "",
    university_name: "",
    program_name: "",
    status: "pending",
    request_date: "",
    submission_deadline: "",
    notes: ""
  });

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('recommendation_letters')
        .select('*')
        .eq('user_id', user?.id)
        .order('submission_deadline', { ascending: true });

      if (error) throw error;
      setLetters(data || []);
    } catch (error) {
      console.error('获取推荐信失败:', error);
      toast({
        title: "获取失败",
        description: "无法加载推荐信数据",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.recommender_name || !formData.recommender_email || !formData.university_name) {
      toast({
        title: "请填写必填项",
        description: "推荐人姓名、邮箱和学校名称为必填项",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('recommendation_letters')
        .insert({
          ...formData,
          user_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "添加成功",
        description: "推荐信记录已添加",
      });

      setFormData({
        recommender_name: "",
        recommender_email: "",
        recommender_title: "",
        relationship: "",
        university_name: "",
        program_name: "",
        status: "pending",
        request_date: "",
        submission_deadline: "",
        notes: ""
      });
      setShowAddForm(false);
      fetchRecommendations();
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
        .from('recommendation_letters')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchRecommendations();
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新推荐信状态",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "待处理", variant: "secondary" as const, color: "bg-gray-500" },
      requested: { label: "已请求", variant: "default" as const, color: "bg-blue-500" },
      submitted: { label: "已提交", variant: "default" as const, color: "bg-green-500" },
      completed: { label: "已完成", variant: "default" as const, color: "bg-emerald-500" }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    return differenceInDays(parseISO(deadline), new Date());
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
            <h1 className="text-3xl font-bold text-foreground mb-2">推荐信管理</h1>
            <p className="text-muted-foreground">管理您的推荐人和推荐信状态</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            添加推荐人
          </Button>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{letters.length}</div>
              <p className="text-sm text-muted-foreground">推荐信总数</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-500">
                {letters.filter(letter => letter.status === 'requested').length}
              </div>
              <p className="text-sm text-muted-foreground">已请求</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-500">
                {letters.filter(letter => letter.status === 'submitted').length}
              </div>
              <p className="text-sm text-muted-foreground">已提交</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-500">
                {letters.filter(letter => letter.submission_deadline && getDaysUntilDeadline(letter.submission_deadline)! < 14).length}
              </div>
              <p className="text-sm text-muted-foreground">2周内截止</p>
            </CardContent>
          </Card>
        </div>

        {/* 添加表单 */}
        {showAddForm && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle>添加推荐人</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recommender_name">推荐人姓名 *</Label>
                  <Input
                    id="recommender_name"
                    value={formData.recommender_name}
                    onChange={(e) => setFormData({...formData, recommender_name: e.target.value})}
                    placeholder="输入推荐人姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recommender_email">推荐人邮箱 *</Label>
                  <Input
                    id="recommender_email"
                    type="email"
                    value={formData.recommender_email}
                    onChange={(e) => setFormData({...formData, recommender_email: e.target.value})}
                    placeholder="输入推荐人邮箱"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recommender_title">推荐人职位</Label>
                  <Input
                    id="recommender_title"
                    value={formData.recommender_title}
                    onChange={(e) => setFormData({...formData, recommender_title: e.target.value})}
                    placeholder="如：教授、主管等"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">与您的关系 *</Label>
                  <Select value={formData.relationship} onValueChange={(value) => setFormData({...formData, relationship: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择关系" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professor">任课教授</SelectItem>
                      <SelectItem value="advisor">学术导师</SelectItem>
                      <SelectItem value="supervisor">工作主管</SelectItem>
                      <SelectItem value="colleague">同事</SelectItem>
                      <SelectItem value="mentor">导师</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university_name">申请学校 *</Label>
                  <Input
                    id="university_name"
                    value={formData.university_name}
                    onChange={(e) => setFormData({...formData, university_name: e.target.value})}
                    placeholder="输入申请学校名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program_name">申请项目</Label>
                  <Input
                    id="program_name"
                    value={formData.program_name}
                    onChange={(e) => setFormData({...formData, program_name: e.target.value})}
                    placeholder="输入申请项目名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request_date">请求日期</Label>
                  <Input
                    id="request_date"
                    type="date"
                    value={formData.request_date}
                    onChange={(e) => setFormData({...formData, request_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submission_deadline">提交截止日期</Label>
                  <Input
                    id="submission_deadline"
                    type="date"
                    value={formData.submission_deadline}
                    onChange={(e) => setFormData({...formData, submission_deadline: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="添加关于这封推荐信的备注信息"
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

        {/* 推荐信列表 */}
        <div className="space-y-4">
          {letters.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">暂无推荐信记录</h3>
                <p className="text-muted-foreground mb-4">开始添加推荐人来管理推荐信状态</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加第一个推荐人
                </Button>
              </CardContent>
            </Card>
          ) : (
            letters.map((letter) => {
              const statusConfig = getStatusBadge(letter.status);
              const daysLeft = letter.submission_deadline ? getDaysUntilDeadline(letter.submission_deadline) : null;
              const isUrgent = daysLeft !== null && daysLeft < 14;

              return (
                <Card key={letter.id} className={`shadow-card hover:shadow-hover transition-all duration-300 ${isUrgent && daysLeft! >= 0 ? 'border-orange-500' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{letter.recommender_name}</h3>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                          {isUrgent && daysLeft! >= 0 && (
                            <Badge variant="destructive" className="animate-pulse">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              紧急
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {letter.recommender_email}
                          </span>
                          {letter.recommender_title && (
                            <span>{letter.recommender_title}</span>
                          )}
                          <span>关系: {letter.relationship}</span>
                        </div>
                      </div>
                      <Select value={letter.status} onValueChange={(value) => updateStatus(letter.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">待处理</SelectItem>
                          <SelectItem value="requested">已请求</SelectItem>
                          <SelectItem value="submitted">已提交</SelectItem>
                          <SelectItem value="completed">已完成</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">申请学校</p>
                        <p className="text-sm text-muted-foreground">{letter.university_name}</p>
                        {letter.program_name && (
                          <p className="text-xs text-muted-foreground">{letter.program_name}</p>
                        )}
                      </div>
                      
                      {letter.request_date && (
                        <div>
                          <p className="text-sm font-medium text-foreground">请求日期</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(letter.request_date), 'yyyy年MM月dd日', { locale: zhCN })}
                          </p>
                        </div>
                      )}
                      
                      {letter.submission_deadline && (
                        <div>
                          <p className="text-sm font-medium text-foreground">提交截止</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(letter.submission_deadline), 'yyyy年MM月dd日', { locale: zhCN })}
                            {daysLeft !== null && (
                              <span className={`ml-2 ${daysLeft < 0 ? 'text-red-500' : daysLeft < 14 ? 'text-orange-500' : 'text-green-500'}`}>
                                ({daysLeft < 0 ? `已过期 ${Math.abs(daysLeft)} 天` : `还有 ${daysLeft} 天`})
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {letter.notes && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm">{letter.notes}</p>
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

export default RecommendationManager;