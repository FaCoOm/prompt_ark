# Prompt Ark 功能清单

**用途**: 技术栈迁移时的功能对照检查表
**来源**: README.md + 代码分析
**日期**: 2026-03-26

## 核心功能

### 1. Prompt 管理
- [ ] 创建新 prompt（支持 Markdown）
- [ ] 编辑 prompt（实时预览）
- [ ] 删除 prompt
- [ ] 搜索 prompt（标题、内容、标签）
- [ ] 按分类筛选
- [ ] 收藏/取消收藏
- [ ] 最近使用排序
- [ ] 批量操作（导出、删除）

### 2. 变量系统
- [ ] 自由文本变量：`{{topic}}`
- [ ] 枚举变量：`{{lang:EN|ZH|JP}}`
- [ ] 默认值变量：`{{style:formal}}`
- [ ] 上下文变量：`{{@page_title}}`、`{{@page_url}}`、`{{@selection}}`、`{{@date}}`、`{{@page_text}}`
- [ ] 变量解析与填充表单生成
- [ ] 上下文抓取（Ctrl+Shift+G，10分钟 TTL）

### 3. AI 平台注入
- [ ] ChatGPT 注入
- [ ] Claude 注入
- [ ] Gemini 注入
- [ ] NotebookLM 注入
- [ ] AI Studio 注入
- [ ] DeepSeek 注入
- [ ] Kimi 注入
- [ ] Doubao 注入
- [ ] Qwen 注入
- [ ] Grok 注入
- [ ] ChatGLM 注入
- [ ] Hailuo 注入
- [ ] Hunyuan 注入
- [ ] 其他平台（共 20+ 平台）
- [ ] Picker 按钮注入
- [ ] Quick Actions 按钮注入
- [ ] 斜杠命令支持（`/keyword`）

### 4. Quick Actions（快捷操作）
- [ ] Rewrite（重写）
- [ ] Summarize（总结）
- [ ] Translate（翻译）
- [ ] Expand（扩展）
- [ ] Explain（解释）
- [ ] 使用平台自身 AI（无需 API key）

### 5. AI 增强功能
- [ ] Prompt 优化（3种风格：简洁/增强/专业）
- [ ] Prompt 翻译（7种语言）
- [ ] 智能转换（Smart Convert）
- [ ] 自动提取标题/分类/标签
- [ ] Diff 视图对比
- [ ] 社交分享文案生成（Twitter/Reddit/知乎/微信/小红书）

### 6. AI 提供商管理
- [ ] Gemini Web（默认，免费）
- [ ] Gemini API
- [ ] OpenAI 兼容协议
- [ ] 多提供商切换
- [ ] 自动登录重定向（会话过期）
- [ ] Edge 浏览器 Cookie 处理

### 7. 数据同步
- [ ] Chrome Sync（默认，~100KB 限制）
- [ ] GitHub Gist 同步
- [ ] WebDAV 同步
- [ ] JSON 导出/导入
- [ ] URL 导入（从 GitHub repo）
- [ ] AI 质量评分

### 8. 用户界面
- [ ] Side Panel 模式
- [ ] Popup 模式
- [ ] 暗色模式
- [ ] 中英文切换
- [ ] Markdown 渲染
- [ ] 实时搜索
- [ ] 分页显示（每页 20 条）
- [ ] 响应式布局

### 9. 快捷键
- [ ] `Ctrl+Shift+P` - 召唤 Picker
- [ ] `Ctrl+Shift+G` - 抓取上下文
- [ ] 自定义快捷键配置

### 10. 右键菜单
- [ ] "Add to Prompt Ark"（保存选中文本）
- [ ] "Smart Convert to Prompt"（智能转换）
- [ ] 上下文感知（仅在选中文本时显示）

### 11. 内置 Prompt 库
- [ ] 100 个预置 prompt（50 英文 + 50 中文）
- [ ] 分类：生产力、写作、编程、教育、创意、分析
- [ ] 首次安装自动导入

### 12. 图片 Prompt 生成器
- [ ] image-prompt.html 独立页面
- [ ] 图片上传/预览
- [ ] AI 生成描述性 prompt

## 技术特性

### 架构
- [ ] Manifest V3
- [ ] Service Worker (background.js)
- [ ] Content Script (content.js)
- [ ] Side Panel API
- [ ] Chrome Storage API (Sync + Local)

### 高级功能
- [ ] Shadow DOM 穿透
- [ ] React Fiber 绕过
- [ ] 深度 DOM 遍历
- [ ] 每平台定制注入逻辑
- [ ] 600ms 防抖自动保存
- [ ] 运行时国际化

### 性能要求
- [ ] 扩展加载 <500ms
- [ ] UI 响应 <100ms
- [ ] 打包体积 <2MB
- [ ] 支持 1000+ prompts

## 测试覆盖

### E2E 测试
- [ ] 保存 prompt 流程
- [ ] 搜索与筛选
- [ ] 注入到 AI 平台
- [ ] 变量解析与填充
- [ ] 同步功能
- [ ] AI 增强功能

### 单元测试
- [ ] storage.js
- [ ] variables.js
- [ ] text-analysis.js
- [ ] ai/provider.js
- [ ] 其他核心模块

### 兼容性测试
- [ ] Chrome 88+
- [ ] Edge
- [ ] Firefox（Manifest V3）
- [ ] 多语言环境
- [ ] 数据迁移（旧版→新版）

## 迁移验证清单

完成迁移后，逐项验证：

1. [ ] 所有核心功能正常工作
2. [ ] 20+ 平台注入测试通过
3. [ ] 数据兼容性测试通过
4. [ ] 性能指标达标
5. [ ] E2E 测试通过率 100%
6. [ ] 无 TypeScript 类型错误
7. [ ] 代码质量达标（单文件 <300 行）
8. [ ] 文档完整更新
