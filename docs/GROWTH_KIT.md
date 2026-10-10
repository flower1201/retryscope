# RetryScope Growth Kit（本地 · 手动）

面向负责人的试用包。**禁止自动发帖 / 求星 / 群发。**

## Pitch（一句话）

Claude Code 会话里工具反复失败时，本地离线找出「卡在哪」，并给出可点的证据时间线——不上云、不调 LLM。

## 最快演示（合成数据 · 可公开）

```bash
git clone https://github.com/flower1201/retryscope.git
cd retryscope
npm install
npm run demo
# 打开 examples/out-demo/index.html （file://）
# 预期：finding RF-001（Bash），时间线可点
```

或 Release（无 clone 源码树）：

```bash
# 从 https://github.com/flower1201/retryscope/releases/tag/v0.1.0-rc.1 下载
# retryscope-0.1.0-rc.1.tgz
npm install ./retryscope-0.1.0-rc.1.tgz
npx retryscope --version   # 0.1.0-rc.1
```

分析自己的会话时：**只传你明确指定的 JSONL 路径**；不要把真实会话贴到 Issue。

## 边界（务必说清楚）

- 发现的是 **潜在** 重复失败模式，不是「浪费了多少 token」
- `success` = 工具未报错，≠ 用户任务已完成
- 不会推断根因；报告默认不含 prompt / 命令原文

## 邀请私信模板（中文）

> 嗨，我做了个本地小工具 RetryScope：分析 Claude Code 的 session JSONL，标出反复失败的工具调用，并生成离线 HTML 报告（不上云）。  
> 现在是 GitHub Pre-release，想找几位常开 Claude Code 的朋友跑一下合成 demo（`npm run demo`），告诉我：装得顺不顺、报告有没有用。不必 Star。  
> 仓库：https://github.com/flower1201/retryscope  

## 邀请 DM（English）

> Built a local CLI — RetryScope — that reads Claude Code session JSONL, flags repeated tool failures, and opens an offline HTML report (no cloud / no LLM). Looking for a few Claude Code users to try the synthetic demo (`npm run demo`) and tell me if install + report are useful. No need to Star.  
> https://github.com/flower1201/retryscope  

## 反馈记录表（复制到笔记）

| 日期 | 谁 | OS/Node | demo OK? | 有用? | 会再开? | 备注 |
|------|----|---------|----------|-------|---------|------|
| | | | | | | |

目标：5 试用 / ≥3 条实质反馈。

社区长文草稿见 [COMMUNITY_DRAFTS.md](./COMMUNITY_DRAFTS.md)。
