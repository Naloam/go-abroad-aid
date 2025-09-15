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
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  School, 
  Globe, 
  Save,
  Settings,
  GraduationCap,
  MapPin,
  Calendar,
  Mail,
  Phone
} from "lucide-react";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  university: string;
  major: string;
  graduation_year: number;
  target_degree: string;
  target_countries: string[];
}

interface UserPreferences {
  target_countries: string[];
  target_degree_level: string;
  budget_min: number;
  budget_max: number;
  preferred_fields: string[];
  language_scores: {
    ielts?: number;
    toefl?: number;
  };
  gre_scores: {
    verbal?: number;
    quantitative?: number;
    writing?: number;
  };
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    university: '',
    major: '',
    graduation_year: new Date().getFullYear(),
    target_degree: '',
    target_countries: []
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    target_countries: [],
    target_degree_level: 'master',
    budget_min: 0,
    budget_max: 100000,
    preferred_fields: [],
    language_scores: {},
    gre_scores: {}
  });

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 
    'Germany', 'France', 'Netherlands', 'Singapore', 'Japan', 'South Korea'
  ];
  
  const fields = [
    'Computer Science', 'Engineering', 'Business', 'Economics', 
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Psychology', 
    'Art & Design', 'Literature', 'History', 'Political Science'
  ];

  const targetDegrees = [
    { value: 'bachelor', label: '本科学位' },
    { value: 'master', label: '硕士学位' },
    { value: 'phd', label: '博士学位' }
  ];

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPreferences();
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
        setProfileData({
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          university: data.university || '',
          major: data.major || '',
          graduation_year: data.graduation_year || new Date().getFullYear(),
          target_degree: data.target_degree || '',
          target_countries: data.target_countries || []
        });
      }
    } catch (error) {
      console.error('获取用户资料失败:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data && !error) {
        setPreferences({
          target_countries: data.target_countries || [],
          target_degree_level: data.target_degree_level || 'master',
          budget_min: data.budget_min || 0,
          budget_max: data.budget_max || 100000,
          preferred_fields: data.preferred_fields || [],
          language_scores: (data.language_scores as { ielts?: number; toefl?: number }) || {},
          gre_scores: (data.gre_scores as { verbal?: number; quantitative?: number; writing?: number }) || {}
        });
      }
    } catch (error) {
      console.log('首次使用，将创建新的偏好设置');
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone,
          university: profileData.university,
          major: profileData.major,
          graduation_year: profileData.graduation_year,
          target_degree: profileData.target_degree,
          target_countries: profileData.target_countries
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "个人资料已保存",
        description: "您的信息已成功更新",
      });
    } catch (error) {
      console.error('保存个人资料失败:', error);
      toast({
        title: "保存失败",
        description: "请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          target_countries: preferences.target_countries,
          target_degree_level: preferences.target_degree_level,
          budget_min: preferences.budget_min,
          budget_max: preferences.budget_max,
          preferred_fields: preferences.preferred_fields,
          language_scores: preferences.language_scores,
          gre_scores: preferences.gre_scores
        });

      if (error) throw error;

      toast({
        title: "偏好设置已保存",
        description: "您的申请偏好已成功更新",
      });
    } catch (error) {
      console.error('保存偏好设置失败:', error);
      toast({
        title: "保存失败",
        description: "请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (country: string, checked: boolean) => {
    if (checked) {
      setProfileData(prev => ({
        ...prev,
        target_countries: [...prev.target_countries, country]
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        target_countries: prev.target_countries.filter(c => c !== country)
      }));
    }
  };

  const handlePreferredFieldChange = (field: string, checked: boolean) => {
    if (checked) {
      setPreferences(prev => ({
        ...prev,
        preferred_fields: [...prev.preferred_fields, field]
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        preferred_fields: prev.preferred_fields.filter(f => f !== field)
      }));
    }
  };

  const handlePreferenceCountryChange = (country: string, checked: boolean) => {
    if (checked) {
      setPreferences(prev => ({
        ...prev,
        target_countries: [...prev.target_countries, country]
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        target_countries: prev.target_countries.filter(c => c !== country)
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <User className="h-8 w-8 text-primary" />
              个人资料
            </h1>
            <p className="text-muted-foreground">
              完善您的个人信息，获得更精准的申请建议
            </p>
          </div>

          <div className="space-y-8">
            {/* 基本信息 */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  基本信息
                </CardTitle>
                <CardDescription>
                  这些信息将用于生成申请材料和院校匹配
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      姓名
                    </Label>
                    <Input
                      id="fullName"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="请输入您的全名"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      邮箱
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      电话
                    </Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+86 138 0013 8000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="university" className="flex items-center gap-2">
                      <School className="h-4 w-4" />
                      本科院校
                    </Label>
                    <Input
                      id="university"
                      value={profileData.university}
                      onChange={(e) => setProfileData(prev => ({ ...prev, university: e.target.value }))}
                      placeholder="例如：北京大学"
                    />
                  </div>

                  <div>
                    <Label htmlFor="major" className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      专业
                    </Label>
                    <Input
                      id="major"
                      value={profileData.major}
                      onChange={(e) => setProfileData(prev => ({ ...prev, major: e.target.value }))}
                      placeholder="例如：计算机科学与技术"
                    />
                  </div>

                  <div>
                    <Label htmlFor="graduationYear" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      毕业年份
                    </Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      min="2020"
                      max="2030"
                      value={profileData.graduation_year}
                      onChange={(e) => setProfileData(prev => ({ ...prev, graduation_year: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetDegree">目标学位</Label>
                    <Select 
                      value={profileData.target_degree} 
                      onValueChange={(value) => setProfileData(prev => ({ ...prev, target_degree: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择目标学位" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetDegrees.map(degree => (
                          <SelectItem key={degree.value} value={degree.value}>
                            {degree.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Globe className="h-4 w-4" />
                    目标国家
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {countries.map(country => (
                      <div key={country} className="flex items-center space-x-2">
                        <Checkbox
                          id={`country-${country}`}
                          checked={profileData.target_countries.includes(country)}
                          onCheckedChange={(checked) => handleCountryChange(country, checked as boolean)}
                        />
                        <label htmlFor={`country-${country}`} className="text-sm">
                          {country}
                        </label>
                      </div>
                    ))}
                  </div>
                  {profileData.target_countries.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {profileData.target_countries.map(country => (
                        <Badge key={country} variant="secondary">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? '保存中...' : '保存基本信息'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 申请偏好 */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  申请偏好
                </CardTitle>
                <CardDescription>
                  设置您的申请偏好，帮助系统推荐更合适的院校
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="targetDegreeLevel">目标学位层次</Label>
                    <Select 
                      value={preferences.target_degree_level} 
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, target_degree_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {targetDegrees.map(degree => (
                          <SelectItem key={degree.value} value={degree.value}>
                            {degree.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">偏好国家</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {countries.map(country => (
                      <div key={country} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pref-country-${country}`}
                          checked={preferences.target_countries.includes(country)}
                          onCheckedChange={(checked) => handlePreferenceCountryChange(country, checked as boolean)}
                        />
                        <label htmlFor={`pref-country-${country}`} className="text-sm">
                          {country}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">偏好专业领域</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {fields.map(field => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field}`}
                          checked={preferences.preferred_fields.includes(field)}
                          onCheckedChange={(checked) => handlePreferredFieldChange(field, checked as boolean)}
                        />
                        <label htmlFor={`field-${field}`} className="text-sm">
                          {field}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">学费预算 (USD/年)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budgetMin" className="text-sm text-muted-foreground">最低预算</Label>
                      <Input
                        id="budgetMin"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={preferences.budget_min || ''}
                        onChange={(e) => setPreferences(prev => ({ ...prev, budget_min: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="budgetMax" className="text-sm text-muted-foreground">最高预算</Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        min="0"
                        placeholder="100000"
                        value={preferences.budget_max || ''}
                        onChange={(e) => setPreferences(prev => ({ ...prev, budget_max: parseInt(e.target.value) || 100000 }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block text-base font-semibold">语言成绩</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ielts" className="text-sm">IELTS</Label>
                      <Input
                        id="ielts"
                        type="number"
                        step="0.5"
                        min="0"
                        max="9"
                        placeholder="7.0"
                        value={preferences.language_scores.ielts || ''}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          language_scores: {
                            ...prev.language_scores,
                            ielts: parseFloat(e.target.value) || undefined
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="toefl" className="text-sm">TOEFL</Label>
                      <Input
                        id="toefl"
                        type="number"
                        min="0"
                        max="120"
                        placeholder="100"
                        value={preferences.language_scores.toefl || ''}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          language_scores: {
                            ...prev.language_scores,
                            toefl: parseInt(e.target.value) || undefined
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block text-base font-semibold">GRE成绩</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="greVerbal" className="text-sm">Verbal</Label>
                      <Input
                        id="greVerbal"
                        type="number"
                        min="130"
                        max="170"
                        placeholder="160"
                        value={preferences.gre_scores.verbal || ''}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          gre_scores: {
                            ...prev.gre_scores,
                            verbal: parseInt(e.target.value) || undefined
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="greQuantitative" className="text-sm">Quantitative</Label>
                      <Input
                        id="greQuantitative"
                        type="number"
                        min="130"
                        max="170"
                        placeholder="170"
                        value={preferences.gre_scores.quantitative || ''}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          gre_scores: {
                            ...prev.gre_scores,
                            quantitative: parseInt(e.target.value) || undefined
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="greWriting" className="text-sm">Writing</Label>
                      <Input
                        id="greWriting"
                        type="number"
                        step="0.5"
                        min="0"
                        max="6"
                        placeholder="4.5"
                        value={preferences.gre_scores.writing || ''}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          gre_scores: {
                            ...prev.gre_scores,
                            writing: parseFloat(e.target.value) || undefined
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={savePreferences} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? '保存中...' : '保存申请偏好'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;