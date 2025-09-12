import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  Search, 
  FileText, 
  TrendingUp,
  MapPin,
  DollarSign,
  Star,
  Users
} from "lucide-react";

export const Demo = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            功能演示
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            体验我们的核心功能，看看如何让您的留学申请变得更加简单高效
          </p>
        </div>

        <Tabs defaultValue="gpa" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gpa" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              GPA计算
            </TabsTrigger>
            <TabsTrigger value="matching" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              院校匹配
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              材料生成
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gpa" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">成绩单输入</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground">
                    <span>课程名称</span>
                    <span>学分</span>
                    <span>成绩</span>
                  </div>
                  {[
                    { course: "高等数学A", credits: "4", score: "92" },
                    { course: "大学物理", credits: "3", score: "88" },
                    { course: "程序设计基础", credits: "3", score: "95" },
                    { course: "线性代数", credits: "2", score: "90" }
                  ].map((item, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">{item.course}</span>
                      <span className="text-sm">{item.credits}</span>
                      <span className="text-sm font-medium">{item.score}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline">
                  添加更多课程
                </Button>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">GPA计算结果</h3>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gradient-primary rounded-lg text-primary-foreground">
                    <div className="text-3xl font-bold mb-2">3.87</div>
                    <div className="text-sm opacity-90">4.0制GPA</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">总学分</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">加权平均分</span>
                      <span className="font-medium">91.25</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">换算标准</span>
                      <Badge variant="secondary">4.0制</Badge>
                    </div>
                  </div>

                  <Button className="w-full">
                    查看详细计算步骤
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="matching" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                {
                  name: "斯坦福大学",
                  program: "计算机科学硕士",
                  match: "冲刺",
                  score: 85,
                  gpa: "3.8+",
                  location: "加利福尼亚州",
                  tuition: "$58,080",
                  scholarship: "有机会"
                },
                {
                  name: "卡内基梅隆大学",
                  program: "软件工程硕士",
                  match: "匹配",
                  score: 92,
                  gpa: "3.5+",
                  location: "宾夕法尼亚州",
                  tuition: "$55,465",
                  scholarship: "较大机会"
                },
                {
                  name: "华盛顿大学",
                  program: "计算机科学硕士",
                  match: "保底",
                  score: 96,
                  gpa: "3.3+",
                  location: "华盛顿州",
                  tuition: "$36,898",
                  scholarship: "很大机会"
                }
              ].map((school, idx) => (
                <Card key={idx} className="p-6 hover:shadow-hover transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-card-foreground">{school.name}</h4>
                      <p className="text-sm text-muted-foreground">{school.program}</p>
                    </div>
                    <Badge 
                      variant={school.match === "冲刺" ? "destructive" : school.match === "匹配" ? "secondary" : "default"}
                    >
                      {school.match}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">匹配度: </span>
                      <span className="font-medium">{school.score}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-warning" />
                      <span className="text-muted-foreground">要求GPA: </span>
                      <span className="font-medium">{school.gpa}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span className="text-muted-foreground">{school.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="text-muted-foreground">学费: </span>
                      <span className="font-medium">{school.tuition}</span>
                    </div>
                  </div>

                  <Badge variant="outline" className="mb-3">
                    奖学金: {school.scholarship}
                  </Badge>

                  <Button variant="outline" className="w-full">
                    查看详情
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">个人信息输入</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">学术背景</h4>
                    <p className="text-sm text-muted-foreground">
                      计算机科学本科，GPA 3.87，主修算法与数据结构、机器学习相关课程...
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">研究经历</h4>
                    <p className="text-sm text-muted-foreground">
                      参与深度学习项目研究，发表SCI论文一篇，获得国家级创新创业大赛二等奖...
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">职业目标</h4>
                    <p className="text-sm text-muted-foreground">
                      希望在人工智能领域深入发展，将来从事AI算法工程师或研究员工作...
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">生成的个人陈述</h3>
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <Badge>学术型</Badge>
                    <Badge variant="outline">质量评分: 92/100</Badge>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                    <p className="mb-3">
                      "As a Computer Science undergraduate with a strong foundation in algorithms and machine learning, 
                      I have maintained a GPA of 3.87 while actively engaging in cutting-edge research..."
                    </p>
                    <p className="mb-3">
                      "My research experience in deep learning has not only resulted in an SCI publication 
                      but also earned recognition through a second-place award in the National Innovation..."
                    </p>
                    <p>
                      "Looking forward, I am committed to advancing the field of artificial intelligence 
                      and aspire to contribute as an AI algorithm engineer or researcher..."
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      重新生成
                    </Button>
                    <Button variant="outline" size="sm">
                      编辑优化
                    </Button>
                    <Button size="sm">
                      导出文档
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};