-- Supabase 数据库初始化脚本
-- 在 Supabase Dashboard -> SQL Editor 中执行

-- 创建 read_posts 表
CREATE TABLE IF NOT EXISTS read_posts (
  id SERIAL PRIMARY KEY,
  tweet_id TEXT NOT NULL UNIQUE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_read_posts_tweet_id ON read_posts(tweet_id);
CREATE INDEX IF NOT EXISTS idx_read_posts_is_read ON read_posts(is_read);

-- 启用 RLS (Row Level Security) - 可选，如果需要多用户支持
ALTER TABLE read_posts ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有操作（单用户场景）
CREATE POLICY "Allow all operations" ON read_posts
  FOR ALL USING (true) WITH CHECK (true);

-- 注释说明
COMMENT ON TABLE read_posts IS '存储已加载的推文，用于过滤重复内容';
COMMENT ON COLUMN read_posts.tweet_id IS '推文的唯一标识';
COMMENT ON COLUMN read_posts.is_read IS '是否已读：false=未读, true=已读';
