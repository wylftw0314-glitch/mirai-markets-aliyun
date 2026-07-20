# MIRAI MARKETS 分支与部署流程

## 分支职责

- `develop`：测试分支。日常开发、修复和功能验证只推送到这里。
- `main`：生产分支。仅在测试站点确认正常后合并，阿里云生产项目只监听该分支。

## 阿里云 ESA 配置

1. 保留现有生产项目 `mirai-markets-aliyun`，Git 分支设置为 `main`。
2. 新建测试项目 `mirai-markets-aliyun-test`，连接同一个 GitHub 仓库，Git 分支设置为 `develop`。
3. 测试项目使用 ESA 自动生成的预览地址或单独的测试子域名，例如 `test.miraimarket.asia`。
4. 生产域名 `miraimarket.asia` / `www.miraimarket.asia` 只绑定生产项目。

## 日常开发

```powershell
git switch develop
git pull origin develop
# 修改、测试并提交
git push origin develop
```

上述操作只更新测试站点，不会触发生产项目。

## 发布到生产

确认测试站点正常后执行：

```powershell
git switch main
git pull origin main
git merge --ff-only develop
git push origin main
git switch develop
```

只有最后的 `git push origin main` 会触发生产部署。

如 `--ff-only` 提示无法快进，先停止发布并检查分支差异，不要使用强制推送。
