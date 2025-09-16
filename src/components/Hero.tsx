import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Calculator, Search, FileText, Star, Users, Award } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Award className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm font-medium text-primary">专业留学申请辅助平台</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              智能化留学申请
              <span className="bg-gradient-hero bg-clip-text text-transparent"> 助您圆梦海外</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              从成绩单解析、GPA计算到院校匹配推荐，再到申请材料自动生成。
              我们为中国学生提供全流程留学申请服务，让申请变得简单高效。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                variant="gradient" 
                size="lg"
                onClick={() => window.location.href = '/auth'}
              >
                一键生成申请包
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg">
                查看生成示例
              </Button>
            </div>
            
            {/* 演示流程 */}
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 mb-8 border">
              <p className="text-sm text-muted-foreground mb-3">✨ 3步即可完成：</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">1</span>
                <span className="text-muted-foreground">上传简历&成绩单</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">2</span>
                <span className="text-muted-foreground">AI自动生成文书</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">3</span>
                <span className="text-muted-foreground">编辑&导出PDF</span>
              </div>
            </div>

            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>已服务 10,000+ 学生</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                <span>4.9 用户评分</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card className="p-6 bg-card/80 backdrop-blur-sm border shadow-card hover:shadow-hover transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-2">智能GPA计算</h3>
                  <p className="text-sm text-muted-foreground">
                    支持多种换算规则，自动解析成绩单，精准计算各类GPA标准
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card/80 backdrop-blur-sm border shadow-card hover:shadow-hover transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <Search className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-2">院校智能匹配</h3>
                  <p className="text-sm text-muted-foreground">
                    基于多维度算法，为您推荐最适合的院校和专业，提升申请成功率
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card/80 backdrop-blur-sm border shadow-card hover:shadow-hover transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-2">文书智能生成</h3>
                  <p className="text-sm text-muted-foreground">
                    AI驱动的个人陈述和简历生成，多种风格模板，提升文书质量
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};