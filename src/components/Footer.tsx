import { BookOpen, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">留学助手</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              专业的留学申请辅助平台，为中国学生提供全流程申请服务，让留学梦想触手可及。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">主要功能</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">成绩单解析</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">GPA计算</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">院校推荐</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">文书生成</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">帮助支持</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">使用指南</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">常见问题</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">联系客服</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">意见反馈</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">联系我们</h3>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>contact@studyassist.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>400-123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>北京市朝阳区</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © 2024 留学助手. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">隐私政策</a>
            <a href="#" className="hover:text-primary transition-colors">服务条款</a>
            <a href="#" className="hover:text-primary transition-colors">Cookie政策</a>
          </div>
        </div>
      </div>
    </footer>
  );
};