import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Calculator, 
  School, 
  FileText, 
  User, 
  TrendingUp,
  BookOpen,
  Target,
  Award
} from "lucide-react";
import { Header } from "@/components/Header";

interface DashboardStats {
  transcripts: number;
  applications: number;
  recommendedPrograms: number;
  avgGpa: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    transcripts: 0,
    applications: 0,
    recommendedPrograms: 0,
    avgGpa: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [transcriptsRes, applicationsRes] = await Promise.all([
        supabase.from('transcripts').select('weighted_gpa').eq('user_id', user?.id),
        supabase.from('applications').select('id').eq('user_id', user?.id)
      ]);

      const transcripts = transcriptsRes.data || [];
      const applications = applicationsRes.data || [];
      
      const avgGpa = transcripts.length > 0 
        ? transcripts.reduce((sum, t) => sum + (t.weighted_gpa || 0), 0) / transcripts.length
        : 0;

      setStats({
        transcripts: transcripts.length,
        applications: applications.length,
        recommendedPrograms: 25, // 模拟数据
        avgGpa: Number(avgGpa.toFixed(2))
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
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
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            欢迎回来，{user?.user_metadata?.full_name || user?.email}
          </h1>
          <p className="text-muted-foreground">
            继续您的留学申请准备之旅
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">成绩单</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.transcripts}</div>
              <p className="text-xs text-muted-foreground">
                已创建成绩单数量
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">申请材料</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.applications}</div>
              <p className="text-xs text-muted-foreground">
                已准备申请材料
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">推荐项目</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.recommendedPrograms}</div>
              <p className="text-xs text-muted-foreground">
                匹配的院校项目
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均GPA</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.avgGpa > 0 ? stats.avgGpa : '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                加权平均绩点
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                快速开始
              </CardTitle>
              <CardDescription>
                选择您想要使用的功能
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/gpa-calculator">
                <Button className="w-full justify-start" variant="outline">
                  <Calculator className="mr-2 h-4 w-4" />
                  GPA计算器
                </Button>
              </Link>
              <Link to="/university-match">
                <Button className="w-full justify-start" variant="outline">
                  <School className="mr-2 h-4 w-4" />
                  院校匹配
                </Button>
              </Link>
              <Link to="/document-generator">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  材料生成
                </Button>
              </Link>
              <Link to="/profile">
                <Button className="w-full justify-start" variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  个人资料
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                申请进度
              </CardTitle>
              <CardDescription>
                您的留学申请准备进度
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">成绩单录入</span>
                  <Badge variant={stats.transcripts > 0 ? "default" : "secondary"}>
                    {stats.transcripts > 0 ? "已完成" : "待完成"}
                  </Badge>
                </div>
                <Progress value={stats.transcripts > 0 ? 100 : 0} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">院校选择</span>
                  <Badge variant="secondary">进行中</Badge>
                </div>
                <Progress value={30} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">申请材料</span>
                  <Badge variant={stats.applications > 0 ? "default" : "secondary"}>
                    {stats.applications > 0 ? "已开始" : "待开始"}
                  </Badge>
                </div>
                <Progress value={stats.applications > 0 ? 50 : 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最近活动 */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>您最近的操作记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无活动记录</p>
              <p className="text-sm">开始使用系统功能后，这里会显示您的操作历史</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;