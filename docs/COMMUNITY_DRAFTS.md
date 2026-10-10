# RetryScope · Community drafts（勿自动发布）

**Status:** drafts only. 由仓库负责人手动选择平台与措辞后再发。禁止自动化、群发、买星。

合成 demo 可以公开；**禁止**粘贴真实 Claude Code 会话 / prompt。

## Show HN（English）

**Title:** Show HN: RetryScope – find where your Claude Code agent got stuck (local)

**Body:**

I kept losing time when Claude Code repeated the same failing tool call. RetryScope is a local-first CLI: point it at a session JSONL, get an offline HTML report with evidence-linked “repeated failure” findings and a clickable timeline. No cloud upload. No LLM API.

Pre-release (not on npm): https://github.com/flower1201/retryscope

```bash
git clone https://github.com/flower1201/retryscope.git
cd retryscope && npm install && npm run demo
# open examples/out-demo/index.html — expect RF-001
```

Limits: findings are *potential* patterns, not token-waste accounting; tool “success” ≠ user task solved; reports omit prompts/commands by design.

Looking for Claude Code users to try the synthetic demo and say whether the report helps.

## V2EX（中文）

**标题：** [开源] RetryScope：本地分析 Claude Code 会话，找出反复失败的工具调用（求试用）

**正文：**

做了个本地 CLI：读取 Claude Code 的 session JSONL，检测「同一工具反复失败」类模式，输出离线 HTML（时间线 + 证据）。不上云、不调 LLM。

Pre-release（尚未 npm）：https://github.com/flower1201/retryscope

```bash
git clone https://github.com/flower1201/retryscope.git
cd retryscope && npm install && npm run demo
# 打开 examples/out-demo/index.html，预期 RF-001
```

说明：结果是潜在模式，不是 token 浪费证明；不要把真实会话贴到 Issue。本人作者，想找常开 Claude Code 的同学试用安装与报告是否有用。不必强求 Star。

## Reddit / X（短）

Local CLI for Claude Code JSONL: repeated tool-failure findings + offline timeline. No cloud.  
https://github.com/flower1201/retryscope · `npm run demo`  
Want install + “was the report useful?” feedback (not stars).

## 发帖前自检

- [ ] 本机 `npm run demo` 仍 OK
- [ ] Release tarball 仍可 `npm install`
- [ ] 文案未承诺 npm Registry / 未夸大修复能力
- [ ] 已准备好回答「和自己 grep JSONL 有啥区别？」
