import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  School, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Filter,
  Star,
  Globe,
  GraduationCap,
  ExternalLink
} from "lucide-react";

interface University {
  id: string;
  name: string;
  name_en: string;
  country: string;
  city: string;
  type: string;
  ranking_qs: number;
  website: string;
}

interface Program {
  id: string;
  university_id: string;
  name: string;
  name_en: string;
  degree_level: string;
  field: string;
  duration_years: number;
  tuition_usd: number;
  min_gpa: number;
  avg_gpa: number;
  language_requirement: string;
  scholarship_available: boolean;
  university: University;
}

interface MatchResult extends Program {
  matchScore: number;
  matchReason: string[];
  category: 'safety' | 'match' | 'reach';
}

interface Preferences {
  targetCountries: string[];
  degreeLevel: string;
  budgetMin: number;
  budgetMax: number;
  preferredFields: string[];
  currentGpa: number;
}

const UniversityMatch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<Preferences>({
    targetCountries: [],
    degreeLevel: 'master',
    budgetMin: 0,
    budgetMax: 100000,
    preferredFields: [],
    currentGpa: 3.5
  });
  const [programs, setPrograms] = useState<Program[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userGpa, setUserGpa] = useState<number>(0);
  
  const countries = ['United States', 'United Kingdom', 'Canada', 'Australia'];
  const fields = ['engineering', 'business', 'arts', 'science', 'medicine'];
  const degreeLevels = [
    { value: 'bachelor', label: '本科' },
    { value: 'master', label: '硕士' },
    { value: 'phd', label: '博士' }
  ];

  useEffect(() => {
    fetchUserGpa();
    fetchPrograms();
  }, [user]);

  const fetchUserGpa = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transcripts')
        .select('weighted_gpa')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setUserGpa(data.weighted_gpa || 0);
        setPreferences(prev => ({ ...prev, currentGpa: data.weighted_gpa || 3.5 }));
      }
    } catch (error) {
      console.log('未找到GPA记录，使用默认值');
    }
  };

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          university:universities(*)
        `);

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('获取项目数据失败:', error);
      toast({
        title: "数据加载失败",
        description: "请刷新页面重试",
        variant: "destructive",
      });
    }
  };

  const calculateMatchScore = (program: Program, prefs: Preferences): { score: number; reasons: string[]; category: 'safety' | 'match' | 'reach' } => {
    let score = 0;
    const reasons: string[] = [];

    // GPA匹配度 (40分)
    const gpaGap = prefs.currentGpa - (program.avg_gpa || 3.0);
    if (gpaGap >= 0.3) {
      score += 40;
      reasons.push(`GPA优势明显 (${prefs.currentGpa} vs ${program.avg_gpa})`);
    } else if (gpaGap >= 0) {
      score += 30;
      reasons.push(`GPA达到平均水平`);
    } else if (gpaGap >= -0.2) {
      score += 20;
      reasons.push(`GPA接近要求`);
    } else {
      score += 5;
      reasons.push(`GPA低于平均要求`);
    }

    // 国家匹配 (20分)
    if (prefs.targetCountries.length === 0 || prefs.targetCountries.includes(program.university.country)) {
      score += 20;
      if (prefs.targetCountries.includes(program.university.country)) {
        reasons.push(`符合目标国家偏好`);
      }
    }

    // 学位层次匹配 (15分)
    if (program.degree_level === prefs.degreeLevel) {
      score += 15;
      reasons.push(`学位层次匹配`);
    }

    // 专业领域匹配 (10分)
    if (prefs.preferredFields.length === 0 || prefs.preferredFields.includes(program.field || '')) {
      score += 10;
      if (prefs.preferredFields.includes(program.field || '')) {
        reasons.push(`专业领域匹配`);
      }
    }

    // 学费预算匹配 (10分)
    if (program.tuition_usd && program.tuition_usd >= prefs.budgetMin && program.tuition_usd <= prefs.budgetMax) {
      score += 10;
      reasons.push(`学费在预算范围内`);
    }

    // 排名加分 (5分)
    if (program.university.ranking_qs && program.university.ranking_qs <= 50) {
      score += 5;
      reasons.push(`世界顶尖大学`);
    } else if (program.university.ranking_qs && program.university.ranking_qs <= 200) {
      score += 3;
      reasons.push(`世界知名大学`);
    }

    // 确定申请类别
    let category: 'safety' | 'match' | 'reach';
    if (gpaGap >= 0.3) {
      category = 'safety';
    } else if (gpaGap >= -0.1) {
      category = 'match';
    } else {
      category = 'reach';
    }

    return { score, reasons, category };
  };

  const searchMatches = () => {
    setLoading(true);
    
    const results: MatchResult[] = programs.map(program => {
      const { score, reasons, category } = calculateMatchScore(program, preferences);
      return {
        ...program,
        matchScore: score,
        matchReason: reasons,
        category
      };
    });

    // 按匹配度排序
    results.sort((a, b) => b.matchScore - a.matchScore);
    
    setMatchResults(results.slice(0, 20)); // 显示前20个结果
    setLoading(false);

    toast({
      title: "匹配完成",
      description: `找到 ${results.length} 个匹配项目`,
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'bg-success text-success-foreground';
      case 'match': return 'bg-warning text-warning-foreground';
      case 'reach': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'safety': return '保底';
      case 'match': return '匹配';
      case 'reach': return '冲刺';
      default: return '未知';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <School className="h-8 w-8 text-primary" />
              院校匹配
            </h1>
            <p className="text-muted-foreground">
              基于您的条件和偏好，智能推荐最适合的院校项目
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 左侧：搜索条件 */}
            <div className="lg:col-span-1">
              <Card className="shadow-card sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    筛选条件
                  </CardTitle>
                  <CardDescription>设置您的申请偏好</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="currentGpa">当前GPA</Label>
                    <Input
                      id="currentGpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={preferences.currentGpa}
                      onChange={(e) => setPreferences(prev => ({ 
                        ...prev, 
                        currentGpa: parseFloat(e.target.value) || 0 
                      }))}
                    />
                    {userGpa > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        系统检测到您的GPA: {userGpa}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>目标国家</Label>
                    <div className="space-y-2 mt-2">
                      {countries.map(country => (
                        <div key={country} className="flex items-center space-x-2">
                          <Checkbox
                            id={country}
                            checked={preferences.targetCountries.includes(country)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setPreferences(prev => ({
                                  ...prev,
                                  targetCountries: [...prev.targetCountries, country]
                                }));
                              } else {
                                setPreferences(prev => ({
                                  ...prev,
                                  targetCountries: prev.targetCountries.filter(c => c !== country)
                                }));
                              }
                            }}
                          />
                          <label htmlFor={country} className="text-sm">{country}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="degreeLevel">学位层次</Label>
                    <Select 
                      value={preferences.degreeLevel} 
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, degreeLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {degreeLevels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>专业领域</Label>
                    <div className="space-y-2 mt-2">
                      {fields.map(field => (
                        <div key={field} className="flex items-center space-x-2">
                          <Checkbox
                            id={field}
                            checked={preferences.preferredFields.includes(field)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setPreferences(prev => ({
                                  ...prev,
                                  preferredFields: [...prev.preferredFields, field]
                                }));
                              } else {
                                setPreferences(prev => ({
                                  ...prev,
                                  preferredFields: prev.preferredFields.filter(f => f !== field)
                                }));
                              }
                            }}
                          />
                          <label htmlFor={field} className="text-sm capitalize">{field}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>学费预算 (USD)</Label>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="budgetMin" className="text-xs">最低</Label>
                        <Input
                          id="budgetMin"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={preferences.budgetMin || ''}
                          onChange={(e) => setPreferences(prev => ({ 
                            ...prev, 
                            budgetMin: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="budgetMax" className="text-xs">最高</Label>
                        <Input
                          id="budgetMax"
                          type="number"
                          min="0"
                          placeholder="100000"
                          value={preferences.budgetMax || ''}
                          onChange={(e) => setPreferences(prev => ({ 
                            ...prev, 
                            budgetMax: parseInt(e.target.value) || 100000 
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={searchMatches} className="w-full" disabled={loading}>
                    {loading ? '匹配中...' : '开始匹配'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：匹配结果 */}
            <div className="lg:col-span-3">
              {matchResults.length === 0 ? (
                <Card className="shadow-card">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <School className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">开始院校匹配</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      设置您的申请偏好，点击"开始匹配"查看推荐院校
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">匹配结果</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-success"></div>
                        保底院校
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-warning"></div>
                        匹配院校
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-destructive"></div>
                        冲刺院校
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    {matchResults.map((result, index) => (
                      <Card key={result.id} className="shadow-card hover:shadow-hover transition-all duration-300">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-lg">
                                  {result.university.name}
                                </CardTitle>
                                <Badge className={getCategoryColor(result.category)}>
                                  {getCategoryLabel(result.category)}
                                </Badge>
                                <Badge variant="outline" className="text-primary">
                                  匹配度: {result.matchScore}%
                                </Badge>
                              </div>
                              <CardDescription className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {result.university.city}, {result.university.country}
                                </span>
                                {result.university.ranking_qs && (
                                  <span className="flex items-center gap-1">
                                    <Star className="h-4 w-4" />
                                    QS排名: {result.university.ranking_qs}
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary mb-1">
                                #{index + 1}
                              </div>
                              <div className="text-xs text-muted-foreground">推荐排名</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-lg">{result.name}</h4>
                              <a 
                                href={result.university.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary-dark transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                <span>{result.degree_level}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span>${result.tuition_usd?.toLocaleString()}/年</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span>GPA要求: {result.avg_gpa}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span>{result.language_requirement}</span>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h5 className="text-sm font-medium mb-2">匹配理由：</h5>
                              <div className="flex flex-wrap gap-2">
                                {result.matchReason.map((reason, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityMatch;