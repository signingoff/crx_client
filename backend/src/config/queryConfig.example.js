import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, '../../data/query-config.json');

// 默认配置
const DEFAULT_CONFIG = {
  homeTimelineQueryId: 'YOUR_HOME_TIMELINE_QUERY_ID_HERE',
  homeLatestTimelineQueryId: 'YOUR_HOME_LATEST_TIMELINE_QUERY_ID_HERE',
  updatedAt: null
};

// 内存中的当前配置
let currentConfig = { ...DEFAULT_CONFIG };

/**
 * 确保配置文件和数据目录存在
 */
function ensureConfigFile() {
  const dataDir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}

/**
 * 加载配置
 */
export function loadConfig() {
  try {
    ensureConfigFile();
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const saved = JSON.parse(data);
    currentConfig = {
      ...DEFAULT_CONFIG,
      ...saved
    };
    console.log('📋 Query ID 配置已加载:');
    console.log('   HomeTimeline:', currentConfig.homeTimelineQueryId);
    console.log('   HomeLatestTimeline:', currentConfig.homeLatestTimelineQueryId);
    if (currentConfig.updatedAt) {
      console.log('   更新时间:', new Date(currentConfig.updatedAt).toLocaleString());
    }
    return currentConfig;
  } catch (err) {
    console.error('加载 Query ID 配置失败:', err.message);
    return DEFAULT_CONFIG;
  }
}

/**
 * 保存配置
 */
export function saveConfig(config) {
  try {
    ensureConfigFile();
    currentConfig = {
      ...currentConfig,
      ...config,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
    console.log('✅ Query ID 配置已保存');
    return currentConfig;
  } catch (err) {
    console.error('保存 Query ID 配置失败:', err.message);
    throw err;
  }
}

/**
 * 获取当前配置
 */
export function getConfig() {
  return { ...currentConfig };
}

/**
 * 更新 Query ID
 */
export function updateQueryId(type, queryId) {
  const validTypes = ['home', 'following'];
  if (!validTypes.includes(type)) {
    throw new Error(`无效的类型: ${type}。必须是: ${validTypes.join(', ')}`);
  }

  const key = type === 'home'
    ? 'homeTimelineQueryId'
    : 'homeLatestTimelineQueryId';

  const config = { [key]: queryId };
  return saveConfig(config);
}

// 初始化加载
loadConfig();
