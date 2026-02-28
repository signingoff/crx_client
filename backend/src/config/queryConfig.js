import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 文件路径
const ENV_FILE = path.join(__dirname, '../../.env');

// 默认配置（当 .env 中没有配置时使用）
const DEFAULT_CONFIG = {
  homeTimelineQueryId: '',
  homeLatestTimelineQueryId: '',
  updatedAt: null
};

// 内存中的当前配置
let currentConfig = { ...DEFAULT_CONFIG };

/**
 * 从 .env 文件读取配置
 */
function loadFromEnvFile() {
  try {
    if (!fs.existsSync(ENV_FILE)) {
      return null;
    }

    const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
    const config = {};

    // 解析 HOME_TIMELINE_QUERY_ID
    const homeMatch = envContent.match(/HOME_TIMELINE_QUERY_ID=(.+)/);
    if (homeMatch && homeMatch[1]) {
      config.homeTimelineQueryId = homeMatch[1].trim();
    }

    // 解析 HOME_LATEST_TIMELINE_QUERY_ID
    const latestMatch = envContent.match(/HOME_LATEST_TIMELINE_QUERY_ID=(.+)/);
    if (latestMatch && latestMatch[1]) {
      config.homeLatestTimelineQueryId = latestMatch[1].trim();
    }

    return config;
  } catch (err) {
    console.error('从 .env 读取配置失败:', err.message);
    return null;
  }
}

/**
 * 保存配置到 .env 文件
 */
function saveToEnvFile(config) {
  try {
    let envContent = '';

    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf-8');
    }

    // 更新 HOME_TIMELINE_QUERY_ID
    if (config.homeTimelineQueryId) {
      if (envContent.includes('HOME_TIMELINE_QUERY_ID=')) {
        envContent = envContent.replace(
          /HOME_TIMELINE_QUERY_ID=.*/,
          `HOME_TIMELINE_QUERY_ID=${config.homeTimelineQueryId}`
        );
      } else {
        envContent += `\nHOME_TIMELINE_QUERY_ID=${config.homeTimelineQueryId}`;
      }
    }

    // 更新 HOME_LATEST_TIMELINE_QUERY_ID
    if (config.homeLatestTimelineQueryId) {
      if (envContent.includes('HOME_LATEST_TIMELINE_QUERY_ID=')) {
        envContent = envContent.replace(
          /HOME_LATEST_TIMELINE_QUERY_ID=.*/,
          `HOME_LATEST_TIMELINE_QUERY_ID=${config.homeLatestTimelineQueryId}`
        );
      } else {
        envContent += `\nHOME_LATEST_TIMELINE_QUERY_ID=${config.homeLatestTimelineQueryId}`;
      }
    }

    fs.writeFileSync(ENV_FILE, envContent);
    return true;
  } catch (err) {
    console.error('保存配置到 .env 失败:', err.message);
    throw err;
  }
}

/**
 * 加载配置
 */
export function loadConfig() {
  try {
    const envConfig = loadFromEnvFile();

    if (envConfig) {
      currentConfig = {
        ...DEFAULT_CONFIG,
        ...envConfig,
        updatedAt: fs.statSync(ENV_FILE).mtime.toISOString()
      };
    } else {
      currentConfig = { ...DEFAULT_CONFIG };
    }

    console.log('📋 Query ID 配置已加载 (from .env):');
    console.log('   HomeTimeline:', currentConfig.homeTimelineQueryId);
    console.log('   HomeLatestTimeline:', currentConfig.homeLatestTimelineQueryId);

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
    // 更新内存中的配置
    currentConfig = {
      ...currentConfig,
      ...config,
      updatedAt: new Date().toISOString()
    };

    // 写入 .env 文件
    saveToEnvFile(config);

    console.log('✅ Query ID 配置已保存到 .env');
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
