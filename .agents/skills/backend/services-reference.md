# 服务层详细参考

## X API 服务

**文件**: `backend/src/services/xService.js`

### 核心函数

#### getFollowingTweets(count, cursor)
获取 Following 时间线推文。

```javascript
const { tweets, nextCursor } = await getFollowingTweets(20);
```

#### getUserTweets(userId, count)
获取指定用户的推文。

```javascript
const tweets = await getUserTweets('123456', 20);
```

#### getUserByScreenName(screenName)
通过用户名获取用户信息（用于解析 @handle）。

```javascript
const user = await getUserByScreenName('elonmusk');
// { id: '123456', screen_name: 'elonmusk', name: 'Elon Musk', ... }
```

### 数据解析

推文数据结构：
```javascript
{
  id: '123456',
  text: '推文内容',
  createdAt: '2024-01-01T00:00:00.000Z',
  author: {
    id: '789',
    name: '用户名',
    username: 'handle',
    avatar: 'https://...',
    description: '简介',
    location: '位置',
    followersCount: 1000,
    followingCount: 500
  },
  media: [
    { type: 'photo', url: 'https://...' }
  ],
  isLongText: false
}
```

### 过滤函数

```javascript
// 检测日语（平假名/片假名）
function isJapaneseText(text)

// 检测韩语（谚文）
function isKoreanText(text)

// 检测中文
function isChineseText(text)
```

---

## Twitter 同步服务

**文件**: `backend/src/services/twitterSync.js`

### 功能说明

自动同步两类数据：
1. **Following 推文** - 每 2 分钟
2. **监控用户推文** - 每 2 分钟

### 启动同步

```javascript
import { startTwitterSync } from './services/twitterSync.js';

// 启动（自动按间隔执行）
startTwitterSync();
```

### 手动同步

```javascript
import { syncFollowing, syncTwitterUsers } from './services/twitterSync.js';

// 同步 Following
await syncFollowing();

// 同步监控用户
await syncTwitterUsers();
```

---

## 雪球服务

**文件**: `backend/src/services/xueqiuService.js`

### 核心函数

#### getUserTimeline(userId, page)
获取用户时间线。

```javascript
const posts = await getUserTimeline('123456', 1);
```

#### getHomeTimeline(page)
获取雪球首页 feed（关注用户帖子）。

```javascript
const posts = await getHomeTimeline(1);
```

#### getUserInfo(userId)
获取用户信息。

```javascript
const user = await getUserInfo('123456');
```

### 雪球帖子结构

```javascript
{
  id: 123456,
  user_id: 789,
  user_screen_name: '用户名',
  text: '帖子内容',
  created_at: '2024-01-01T00:00:00.000Z',
  reposts_count: 10,
  comments_count: 5,
  likes_count: 20
}
```

---

## 雪球同步服务

**文件**: `backend/src/services/xueqiuSync.js`

### 功能说明

自动同步两类数据：
1. **监控用户帖子** - 每 5 分钟
2. **首页 feed** - 每 5 分钟（user_id=0 存储）

### 启动同步

```javascript
import { startXueqiuSync } from './services/xueqiuSync.js';

startXueqiuSync();
```

---

## 雪球 Cookie 配置

### 获取 Cookie 方法

1. 浏览器登录 xueqiu.com
2. F12 打开开发者工具
3. Application → Cookies → xueqiu.com
4. 复制 `xq_a_token` 的值

### 配置方式

存储在数据库 `settings` 表：
- key: `XUEQIU_COOKIE`
- value: `xq_a_token` 的值

### 雪球 API 端点

```
# 用户时间线
GET https://xueqiu.com/statuses/user_timeline.json?user_id={ID}&page={page}&type=1

# 首页 feed（关注用户）
GET https://xueqiu.com/v2/statuses/home_timeline.json?page={page}

# 用户信息
GET https://xueqiu.com/v4/users/{id}
```

### 请求参数

| 参数 | 说明 |
|------|------|
| user_id | 雪球用户ID |
| page | 页码（默认1） |
| type | 类型（1=全部, 2=问答, 4=原创） |

### 常见问题

**返回空数据**
- 原因：用户没有发言、隐私设置、或 Cookie 过期
- 解决：检查 Cookie 是否有效

**403 Forbidden**
- 原因：IP 被封禁或 Cookie 过期
- 解决：更新 Cookie

---

## Query ID 配置服务

**文件**: `backend/src/config/settingsConfig.js`

### 支持的 Query ID

| 类型 | 默认 key | 用途 |
|------|----------|------|
| homeTimeline | HOME_TIMELINE_QUERY_ID | For You 时间线 |
| homeLatestTimeline | HOME_LATEST_TIMELINE_QUERY_ID | Following 时间线 |
| userTweets | USER_TWEETS_QUERY_ID | 用户推文 |
| userByScreenName | USER_BY_SCREEN_NAME_QUERY_ID | 用户名解析 |

### 核心函数

```javascript
// 获取所有 Query ID
const config = await getQueryConfig();

// 获取单个 Query ID
const queryId = await getQueryId('userTweets');

// 更新 Query ID
await updateQueryId('userTweets', 'newQueryId');

// 从环境变量重置
await resetQueryId('userTweets');
```

### Cookie 获取

```javascript
import { getXCookies } from '../config/settingsConfig.js';

const { auth_token, ct0, bearer_token } = await getXCookies();
```

### 自动检测 Query ID

```javascript
// 从 x.com 网页抓取 Query ID
await detectQueryIds();
```

**注意**: `userByScreenName` 无法自动检测，需手动配置。
