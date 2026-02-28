// 数据库统一入口
// 根据环境变量自动选择 SQLite 或 Supabase

const useSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY;

let db;

if (useSupabase) {
  console.log('📦 使用 Supabase 数据库');
  db = await import('./supabase.js');
} else {
  console.log('📦 使用 SQLite 数据库');
  db = await import('./sqlite.js');
}

export const {
  isPostLoaded,
  markPostsAsLoaded,
  markPostAsRead,
  getReadStats
} = db;

export default db;
