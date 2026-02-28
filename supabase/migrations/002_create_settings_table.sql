-- 创建设置表，存储环境变量配置
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- 插入默认配置（从环境变量迁移）
INSERT INTO settings (key, value, description) VALUES
  ('HOME_TIMELINE_QUERY_ID', 'MpnCeE0hy8m5eWobPx8euw', 'HomeTimeline API Query ID'),
  ('HOME_LATEST_TIMELINE_QUERY_ID', 'csRxUH5ocwnJtPnB3-wr4g', 'HomeLatestTimeline API Query ID'),
  ('X_AUTH_TOKEN', '', 'X.com auth_token cookie'),
  ('X_BEARER_TOKEN', 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA', 'X.com API Bearer Token'),
  ('X_CT0', '', 'X.com ct0 cookie (CSRF token)')
ON CONFLICT (key) DO NOTHING;
