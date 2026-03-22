# Git提交操作指南

## 1. 查看文件状态
```bash
"F:\Git\bin\git.exe" status
```
显示哪些文件被修改、新增或删除。

## 2. 添加文件到暂存区
```bash
# 添加所有修改的文件
"F:\Git\bin\git.exe" add .

# 或添加特定文件
"F:\Git\bin\git.exe" add 文件名.js
```

## 3. 提交更改
```bash
"F:\Git\bin\git.exe" commit -m "提交说明"
```
*注：提交说明应该简洁描述本次修改的内容*

## 4. 查看提交历史
```bash
"F:\Git\bin\git.exe" log --oneline
```

## 5. 查看文件差异
```bash
"F:\Git\bin\git.exe" diff
```

## 6. 示例流程
```bash
# 1. 修改文件后，查看状态
"F:\Git\bin\git.exe" status

# 2. 添加修改的文件
"F:\Git\bin\git.exe" add .

# 3. 提交更改
"F:\Git\bin\git.exe" commit -m "修复游戏逻辑bug"

# 4. 查看提交记录
"F:\Git\bin\git.exe" log --oneline
```

## 7. 注意事项
- 每次提交前先使用`status`查看文件状态
- 提交说明应该清晰描述修改内容
- 可以多次`add`后一次性`commit`
- 使用`diff`查看具体修改内容后再提交
- 确保在项目根目录（D:\WorkSpace\Creator\gobang）执行Git命令

## 8. 常用Git命令速查
```bash
# 查看状态
"F:\Git\bin\git.exe" status

# 查看差异
"F:\Git\bin\git.exe" diff

# 添加所有文件
"F:\Git\bin\git.exe" add .

# 添加特定文件
"F:\Git\bin\git.exe" add 文件名

# 提交更改
"F:\Git\bin\git.exe" commit -m "说明"

# 查看提交历史
"F:\Git\bin\git.exe" log --oneline

# 查看完整提交历史
"F:\Git\bin\git.exe" log

# 撤销未暂存的修改
"F:\Git\bin\git.exe" checkout -- 文件名

# 撤销已暂存的文件
"F:\Git\bin\git.exe" reset HEAD 文件名
```

## 9. Git配置信息
- **用户名**：1
- **邮箱**：1@example.com
- **项目位置**：D:\WorkSpace\Creator\gobang
- **Git仓库**：D:\WorkSpace\Creator\gobang\.git