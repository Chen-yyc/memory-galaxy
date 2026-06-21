# 变更记录

## [1.1.0] - 2026-06-21

### 新增
- 星空序言：首次访问时沉浸式文字引入，支持跳过和重温
- 星空彩蛋：点击涟漪、流星许愿、长按浮现寄语
- 星空日历：首页右上角精美日历，节气提示、纪念日星标
- 星系两侧装饰星云（星云团、星团簇、漂浮光球、流星轨迹）
- OG 分享图和 favicon
- README.md 项目文档
- CHANGELOG.md 变更记录

### 修复
- 行星进入子页面后返回，轨道动画不恢复的 Bug
- 序言与新手引导的触发冲突
- 序言未适配 prefers-reduced-motion
- loadAISettings async 调用导致 AI 模式徽章闪烁
- prefers-reduced-motion 中 !important 覆盖 JS transform 的问题
- resize 事件中星星位置随机重分配改为按比例换算
- initPlanetInteractions 布尔暂停状态改为计数器

### 优化
- 单文件拆分为 11 CSS + 16 JS 多文件结构
- 提取 CONFIG 配置常量（11 个魔法数字）
- ModalManager 统一弹窗管理
- escapeHtml 复用 DOM 元素
- 定时器注册与清理机制
- API Key AES-GCM 加密存储
- 数据导入安全校验（Schema + 存储空间 + XSS 过滤）
- 存储用量提示 + 图片存储预警
- backdrop-filter @supports 降级（29 处）
- CDN 资源 onerror 回退
- 弹窗 ARIA 完善（12 个弹窗）
- SEO 元数据（OG、Twitter Card、canonical）

## [1.0.0] - 初始版本

### 功能
- 星系首页环形轨道布局
- 纪念空间 CRUD（照片、生平、性格标签）
- AI 温暖对话（本地匹配 + API 模式）
- 生命星轨时间线
- 心愿传承（长按仪式、流星动画）
- 家族共享（留言墙、回忆相册、代际传承树）
- 每日寄语
- 节日模式 + 纪念日提醒
- 星空粒子背景
- 响应式适配
