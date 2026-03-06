# 数据库操作详细参考

## Supabase 数据库

**文件**: `backend/src/db/supabase.js`

### 表结构

#### twitter_posts 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | 推文 ID |
| user_id | TEXT | 作者 ID |
| text | TEXT | 推文内容 |
| created_at | TIMESTAMPTZ | 创建时间 |
| author | JSONB | 作者信息 |
| media | JSONB | 媒体数据 |
| is_read | BOOLEAN | 是否已读 |

#### xueqiu_posts 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PRIMARY KEY | 帖子 ID |
| user_id | BIGINT | 作者 ID |
| user_screen_name | TEXT | 作者名 |
| text | TEXT | 帖子内容 |
| created_at | TIMESTAMPTZ | 创建时间 |
| reposts_count | INTEGER | 转发数 |
| comments_count | INTEGER | 评论数 |
| likes_count | INTEGER | 点赞数 |
| is_read | BOOLEAN | 是否已读 |

#### twitter_users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | TEXT PRIMARY KEY | 用户 ID |
| screen_name | TEXT | 用户名 |
| name | TEXT | 显示名 |
| profile_image_url | TEXT | 头像 URL |
| description | TEXT | 简介 |
| followers_count | INTEGER | 粉丝数 |
| friends_count | INTEGER | 关注数 |

#### xueqiu_users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PRIMARY KEY | 用户 ID |
| user_id | BIGINT UNIQUE | 用户 ID |
| screen_name | TEXT | 用户名 |
| profile_image_url | TEXT | 头像 URL |
| description | TEXT | 简介 |
| followers_count | INTEGER | 粉丝数 |
| friends_count | INTEGER | 关注数 |

#### settings 表
| 字段 | 类型 | 说明 |
|------|------|------|
| key | TEXT PRIMARY KEY | 配置键 |
| value | TEXT | 配置值 |
| description | TEXT | 描述 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 核心函数

```javascript
// 获取推文列表（分页）
export async function getAllTwitterPosts(page = 1, limit = 20)

// 获取雪球帖子列表
export async function getAllXueqiuPosts(page = 1, limit = 20)

// 保存推文
export async function saveTwitterPost(post)

// 保存雪球帖子
export async function saveXueqiuPost(post)

// 检查推文是否已读
export async function isPostRead(tweetId)

// 标记已读/未读
export async function markPostAsRead(tweetId, isRead = true)

// 批量查询已读状态
export async function getReadStatusBatch(tweetIds)

// 获取监控用户列表
export async function getTwitterUsers()
export async function getXueqiuUsers()

// 添加/删除监控用户
export async function addTwitterUser(user)
export async function deleteTwitterUser(userId)
export async function addXueqiuUser(user)
export async function deleteXueqiuUser(userId)

// Query ID 配置
export async function getSetting(key)
export async function setSetting(key, value, description)

// Cookie 获取
export async function getXCookies()
```

### 使用示例

```javascript
import {
  getAllTwitterPosts,
  saveTwitterPost,
  isPostRead,
  markPostAsRead
} from '../db/supabase.js';

// 获取推文列表
const posts = await getAllTwitterPosts(1, 20);

// 保存新推文
await saveTwitterPost({
  id: '123456',
  user_id: '789',
  text: '推文内容',
  created_at: new Date().toISOString(),
  author: { name: 'User', username: 'handle' }
});

// 检查已读状态
const isRead = await isPostRead('123456');

// 标记已读
await markPostAsRead('123456', true);
```
