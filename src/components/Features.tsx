import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  Search, 
  FileText, 
  Upload, 
  Globe, 
  BarChart3,
  CheckCircle,
  ArrowRight 
} from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: Upload,
      title: "成绩单上传解析",
      description: "支持图片、PDF上传，OCR智能识别课程信息，自动提取学分和成绩",
      benefits: ["支持多种格式", "OCR智能识别", "数据自动提取"],
      color: "primary"
    },
    {
      icon: Calculator,
      title: "多标准GPA计算",
      description: "支持4.0、5.0等多种GPA标准，按学分加权计算，适配不同国家要求",
      benefits: ["多种换算规则", "学分加权计算", "详细计算步骤"],
      color: "success"
    },
    {
      icon: Search,
      title: "院校智能推荐",
      description: "基于GPA、专业、预算等多维度匹配，推荐最适合的院校和项目",
      benefits: ["多因子匹配", "保底/匹配/冲刺分层", "奖学金机会分析"],
      color: "accent"
    },
    {
      icon: FileText,
      title: "申请材料生成",
      description: "AI智能生成个人陈述、简历、推荐信等申请材料，多种风格可选",
      benefits: ["多种写作风格", "质量评分反馈", "可视化编辑建议"],
      color: "warning"
    },
    {
      icon: Globe,
      title: "全球院校数据库",
      description: "覆盖全球主要留学目的地，实时更新录取要求和申请信息",
      benefits: ["数据实时更新", "详细录取要求", "费用和奖学金信息"],
      color: "primary"
    },
    {
      icon: BarChart3,
      title: "申请进度管理",
      description: "可视化跟踪申请进度，管理多个学校的申请材料版本",
      benefits: ["进度可视化", "版本管理", "截止日期提醒"],
      color: "success"
    }
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            专业功能，助力申请成功
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            从成绩评估到材料生成，我们提供全流程的留学申请解决方案
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group p-6 border shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex p-3 rounded-lg mb-4 bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              
              <h3 className="text-xl font-semibold text-card-foreground mb-3">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {feature.description}
              </p>

              <ul className="space-y-2 mb-6">
                {feature.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant="ghost" 
                className="w-full group-hover:bg-primary/5 transition-colors"
              >
                了解更多
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};