// 由 scripts/gen-templates.mjs 生成——勿手改（源：scripts/seeds/codecv/raw/cv-agent-development.json）
export default {
  name: "Agent开发工程师",
  font: "Noto Sans SC",
  lineHeight: 20,
  content: "### !bg[*张启航 - Agent 开发工程师*](#e7f3f8)\n\n共青团员 ｜ 138-6620-7531 ｜cv-agent-development@example.com ｜ icon:github github.com/qihang-agent\n\n## !c[教育](#d44c47)!c[背景](#448361)\n\n::: start\n**浙江大学** `985` `C9`\n:::\n**本科（专业前5%）**\n:::\n**计算机科学与技术专业**\n:::\n**2022.09-2026.06**\n::: end\n\n- **曾获奖项：**国家奖学金；全国大学生数学建模竞赛一等奖；CCF CSP 认证（400+）；开源 Agent 框架 AgentLite 作者（GitHub 2.1k Star）\n- **校园经历：**担任校计算机协会技术部部长，组织 3 届校内 Hackathon；华为软件精英挑战赛全国八强\n\n## !c[实习](#d44c47)!c[经历](#448361)\n\n::: start\nicon:bytedance **字节跳动**\n:::\n**Flow 团队 - AI 应用架构组**\n:::\n**Agent 开发实习生**\n:::\n**2026.03-2026.06**\n::: end\n\n**负责模块**：豆包深思考模式任务编排引擎 `LangGraph` `Function Calling` `MCP协议` `Agent评测`\n\n基于多智能体协作框架重构复杂任务的规划执行链路，为豆包亿级用户的深度问答场景提供稳定高可用的 Agent 推理服务。\n\n- 设计**ReAct 与反思（Reflection）混合决策架构**，抑制长链路任务执行漂移问题，多步骤复杂任务成功率从 72% **提升至 89%**\n- 基于 **MCP 协议**统一 40+ 内部工具的注册、鉴权与调用规范，解决工具接入碎片化问题，新工具接入周期从 3 天**缩短至 2 小时**\n- 构建**分层记忆机制**（工作记忆 + 长期向量记忆），压缩多轮对话冗余上下文，Token 消耗**下降 35%**，端到端响应时延降低 28%\n- 搭建**轨迹回放 + LLM-as-Judge 自动化评测体系**，覆盖 500+ 真实场景用例，Agent 版本迭代回归效率**提升 4 倍**\n\n::: start\nicon:tencent **腾讯**\n:::\n**混元大模型 - 应用算法工程组**\n:::\n**大模型应用开发实习生**\n:::\n**2025.06-2025.09**\n::: end\n\n**负责模块**：腾讯元宝深度搜索 Agent 检索增强链路 `多智能体` `RAG` `Prompt工程` `向量检索`\n\n通过“规划-执行-校验”三段式多智能体架构优化复杂问题的求解链路，为元宝 App 搜索场景提供高质量的生成式问答服务。\n\n- 主导**多 Agent 任务分解架构**落地，将复杂问题拆解为可并行的子任务树，解决单 Agent 上下文过载问题，深度问答用户满意度**提升 21%**\n- 采用**查询改写与混合检索策略**（BM25 + 向量召回 + 重排序），解决口语化 Query 召回偏移问题，Top-5 检索精准率**提升至 91%**\n- 实现**工具沙箱与降级重试机制**，隔离异常工具调用对主链路的影响，线上工具调用失败率从 8.3% **降至 1.5%**\n- 沉淀 **Prompt 版本管理与灰度 AB 实验框架**，支撑 12 个策略两周内完成上线验证，实验迭代周期**缩短 60%**\n\n## !c[科研与](#d44c47)!c[项目经历](#448361)\n\n::: start\n**AgentLite - 轻量级多智能体开发框架** `Python` `LangGraph` `开源项目`\n:::\n**2025.09- 至今**\n::: end\n\n**项目描述**：面向中小团队的开源多智能体编排框架，提供角色定义、任务编排、工具热插拔与执行轨迹可视化等核心能力。\n\n- 设计**声明式 Agent 编排 DSL**，以 YAML 描述多智能体拓扑与消息路由，10 行代码即可跑通官方示例，显著降低多智能体系统搭建门槛\n- 基于 Pydantic 实现**工具热插拔与 Schema 自动生成**，自动提取函数签名产出 Function Calling 描述，单个工具接入开发成本**降低 70%**\n- 内置 **Token 级轨迹追踪与回放面板**，支持逐步调试 Agent 决策过程，已被 3 个企业内部项目接入使用\n- 项目开源后获 **GitHub 2.1k Star**、120+ Fork，主导 Review 并合并 30+ 社区 PR\n\n## !c[技能证书与](#d44c47)!c[其他](#448361)\n\n- **Agent 技术**：深入理解 ReAct、Plan-and-Execute、多智能体协作等架构范式，熟悉 Function Calling、MCP 协议及 LangGraph、AutoGen 等主流框架\n- **编程语言**：熟练掌握 Python（FastAPI、Pydantic、AsyncIO）；掌握 Go 语言基础；了解 TypeScript/Node.js\n- **RAG 与数据**：熟悉 Milvus、FAISS 等向量数据库与 Embedding、重排序模型调优，具备检索链路全栈优化经验\n- **工程素养**：熟悉 Docker/K8s 容器化部署、Kafka 消息队列与 Prometheus 监控；英语 CET-6，可流畅阅读英文论文与技术文档",
  primaryColor: "#545454",
  primaryBackground: "#333333",
  img: "/covers/cv-agent-development.webp",
  hot: 483,
  slug: "cv-agent-development",
  description: "一份面向 Agent 开发工程师岗位的应届生简历，围绕大模型应用全链路展开：两段大厂 AI 实习（字节跳动 Flow 团队的任务编排引擎、腾讯混元的深度搜索 Agent）覆盖多智能体架构、MCP 工具协议、分层记忆、RAG 检索增强与 Agent 评测等核心热点；科研与项目经历以开源多智能体框架 AgentLite 和强化学习工具调用研究为双主线，突出工程落地与学术深度兼备。每条经历均采用「技术策略 → 解决的问题 → 量化收益」的句式组织，指标加粗醒目，内容密度高且真实可信，适合计算机相关专业应届生投递 Agent / 大模型应用开发岗位时参考套用。",
  tags: [
    "校招",
    "程序员",
    "AI"
  ],
  level: "校招",
  avatar: {
    url: "/codecv-assets/avatar.jpg",
    top: 5,
    left: 670,
    type: "square"
  }
}
