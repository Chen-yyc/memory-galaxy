# 记忆星系

> 在浩瀚星河中，为逝去的亲人点亮一颗记忆之星，让爱与思念以温柔的方式延续。

记忆星系是一个纯前端的纪念类 Web 应用，以星空为隐喻，将逝去亲人的记忆化作宇宙中的行星。用户可以创建纪念空间、与 AI 温暖对话、记录生命星轨、传承心愿、与家族共享回忆。

## 功能一览

| 模块 | 说明 |
|------|------|
| 星系首页 | 环形轨道布局，6 颗行星对应 6 大功能入口 |
| 纪念空间 | 创建/编辑/删除纪念，上传照片、填写生平、性格标签 |
| AI 温暖对话 | 本地匹配 + API 模式，以逝者口吻温柔回应 |
| 生命星轨 | 时间线大事记，AI 辅助生成人生故事 |
| 心愿传承 | 创建心愿星，长按仪式放飞，传承给后人 |
| 家族共享 | 留言墙、回忆相册、代际传承树 |
| 星空序言 | 首次访问的沉浸式文字引入 |
| 星空日历 | 节气提示、纪念日星标标记 |
| 星空彩蛋 | 点击涟漪、流星许愿、长按寄语 |

## 技术栈

- **HTML / CSS / 原生 JavaScript**（无框架、无构建工具）
- **存储**：localStorage（API Key 使用 SubtleCrypto AES-GCM 加密）
- **外部依赖**（CDN，加载失败不影响核心功能）：
  - [AOS](https://github.com/michalsnik/aos) - 滚动动画
  - [vanilla-tilt](https://github.com/micku7zu/vanilla-tilt.js) - 3D 倾斜效果
  - Google Fonts - ZCOOL XiaoWei / Noto Serif SC / Noto Sans SC

## 本地运行

```bash
# 方式一：Python 内置服务器
cd 记忆星系
python -m http.server 8080
# 浏览器打开 http://localhost:8080

# 方式二：Node.js
npx serve .

# 方式三：直接用浏览器打开 index.html
# （部分功能可能因 file:// 协议受限）
```

## 部署

纯静态站点，上传整个目录到任意静态托管平台即可：

- **GitHub Pages**：推送至仓库，Settings → Pages → 选择分支
- **Vercel / Netlify**：连接仓库，框架选择"Other"，无需构建命令
- **阿里云 OSS / 腾讯云 COS**：开启静态网站托管，上传全部文件

无需后端服务、无需数据库、无需环境变量。

## 目录结构

```
记忆星系/
├── index.html              # 页面结构 + 外部资源引用
├── css/
│   ├── variables.css       # CSS 变量（颜色、间距）
│   ├── base.css            # 重置、body、滚动条
│   ├── animations.css      # 所有 @keyframes 动画
│   ├── starfield.css       # 星空背景（星点、星云、流星）
│   ├── galaxy.css          # 星系首页（轨道、行星、装饰星云）
│   ├── components.css      # 通用组件（导航栏、表单、日历、引导）
│   ├── modals.css          # 弹窗/遮罩层
│   ├── pages.css           # 子页面样式
│   ├── effects.css         # 视觉特效（玻璃悬浮、渐变边框、彩蛋）
│   └── responsive.css      # 响应式适配 + @media 查询
├── js/
│   ├── state.js            # 全局状态 + CONFIG 常量 + localStorage 持久化
│   ├── utils.js            # 工具函数（ModalManager、防抖、escapeHtml、数据导入导出）
│   ├── particles.js        # 星空粒子系统
│   ├── router.js           # 页面路由 + 行星转场 + 定时器管理
│   ├── memorial.js         # 纪念空间 CRUD
│   ├── ai-chat.js          # AI 对话（本地匹配 + API）
│   ├── orbit.js            # 生命星轨
│   ├── wish.js             # 心愿传承
│   ├── family.js           # 家族共享（留言墙、传承树）
│   ├── festival.js         # 节日模式 + 纪念日提醒
│   ├── quotes.js           # 每日寄语
│   ├── prologue.js         # 星空序言
│   ├── easter-eggs.js      # 星空彩蛋（涟漪、流星许愿、长按寄语）
│   ├── calendar.js         # 星空日历
│   ├── enhancements.js     # 增强特效（3D 倾斜、波纹、文字微光）
│   └── app.js              # 入口初始化
└── assets/
    ├── favicon.jpg         # 网站图标
    └── og-image.jpg        # 社交分享预览图
```

## 浏览器兼容性

- Chrome / Edge 88+（backdrop-filter、SubtleCrypto）
- Firefox 87+
- Safari 14+
- 移动端 iOS Safari 14+ / Chrome Android

不支持 IE。`prefers-reduced-motion` 用户会自动获得减弱动画体验。

## 数据与隐私

- 所有数据存储在用户本地浏览器 localStorage 中，不上传任何服务器
- API Key 使用 AES-GCM 加密后存储（盐值为公开值，纯前端应用固有局限）
- 数据可随时通过页脚"导出备份"导出为 JSON 文件
- 导出数据不包含 API Key

## 自定义

修改 `css/variables.css` 中的 CSS 变量可快速调整全局配色。修改 `js/state.js` 中的 `CONFIG` 对象可调整功能参数（心愿上限、照片压缩质量、API 超时等）。

## License

MIT
