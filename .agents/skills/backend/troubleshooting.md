# 后端常见问题排查

## Cookie 和认证问题

### API 返回 401/403

**现象**: 请求 X API 返回 401 或 403 错误

**原因**: Cookie 过期

**解决**:
1. 登录 x.com
2. F12 打开开发者工具
3. Application/Storage → Cookies
4. 复制新值：
   - `auth_token` → 数据库 `X_AUTH_TOKEN`
   - `ct0` → 数据库 `X_CT0`

### "Query not found" 错误

**现象**: X API 返回 "Query not found"

**原因**: Query ID 已过期

**解决**:
1. 打开 x.com → F12 → Network
2. 找到 HomeLatestTimeline 请求
3. 提取 Query ID：`graphql/QUERY_ID/HomeLatestTimeline`
4. 在前端设置面板更新

---

## 数据库问题

### 连接失败

**现象**: `Supabase connection error`

**检查清单**:
- [ ] SUPABASE_URL 是否正确
- [ ] SUPABASE_SERVICE_KEY 是否有效
- [ ] Supabase 项目是否运行

### 数据未保存

**现象**: 同步运行但数据库无数据

**排查步骤**:
1. 检查日志 `backend/backend.log`
2. 确认表结构正确
3. 检查 save 函数返回值

---

## 同步问题

### 无法获取新推文

**检查清单**:
- [ ] Query ID 是否有效
- [ ] Cookie 是否过期
- [ ] 网络连接是否正常
- [ ] 后端日志是否有错误

### 同步间隔不生效

**现象**: 同步没有按设定间隔执行

**排查**:
```javascript
// 检查 sync 是否已启动
console.log('Twitter sync started');

// 检查定时器是否运行
setInterval(() => {
  console.log('Sync running at', new Date());
}, 120000);
```

---

## 端口和网络

### 端口被占用

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# 或使用 npx
npx kill-port 3000
```

### CORS 错误

**现象**: 前端请求被 CORS 阻止

**解决**: 检查 `backend/src/index.js` CORS 配置：
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
```

---

## 日志查看

### 实时查看日志

```bash
# Windows
tail -f backend\backend.log

# Linux/Mac
tail -f backend/backend.log
```

### 日志级别

- 错误：`console.error()` - 异常和失败
- 警告：`console.warn()` - 需要注意但非致命
- 信息：`console.log()` - 常规操作记录

---

## 调试技巧

### 数据库查询调试

```javascript
// 在 supabase.js 中添加日志
export async function getAllTwitterPosts(page, limit) {
  console.log('Querying posts:', { page, limit });
  const { data, error } = await supabase
    .from('twitter_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    console.error('Database error:', error);
  }
  console.log('Query result:', data?.length || 0, 'posts');
  return data || [];
}
```

### API 请求调试

```javascript
// 在 xService.js 中添加日志
console.log('Fetching tweets with headers:', headers);
console.log('Response status:', response.status);
console.log('Parsed tweets:', tweets.length);
```
