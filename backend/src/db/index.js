// 数据库统一入口
// 根据环境变量自动选择 SQLite 或 Supabase

const useSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY;

let db;

try {
  if (useSupabase) {
    console.log('📦 使用 Supabase 数据库');
    db = await import('./supabase.js');
  } else {
    // Vercel 环境必须使用 Supabase，本地开发可选 SQLite
    console.log('⚠️ 未配置 Supabase，数据库功能将不可用');
    // 提供一个空的 db 实现
    db = {
      isPostRead: async () => false,
      markPostAsRead: async () => {},
      getReadStats: async () => ({ read: 0, unread: 0 })
    };
  }
} catch (err) {
  console.error('数据库初始化失败:', err.message);
  // 提供 fallback 实现
  db = {
    isPostRead: async () => false,
    markPostAsRead: async () => {},
    getReadStats: async () => ({ read: 0, unread: 0 })
  };
}

export const {
  isPostRead,
  markPostAsRead,
  getReadStats
} = db;

export default db;
