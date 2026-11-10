const http = require('http');
const fs = require('fs');
const path = require('path');
const { updateJobs } = require('./scripts/update-jobs');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API: 触发岗位库更新
  if (req.url === '/api/update-jobs' && req.method === 'POST') {
    console.log('\n=== 收到更新岗位库请求 ===');
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    try {
      const result = await updateJobs();
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (error) {
      console.error('更新失败:', error);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        message: '更新失败: ' + error.message
      }));
    }
    return;
  }

  // API: 获取更新状态（可选）
  if (req.url === '/api/status' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ready',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 静态文件服务
  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // 移除查询参数
  if (filePath.includes('?')) {
    filePath = filePath.split('?')[0];
  }

  filePath = path.join(ROOT_DIR, filePath);

  // 安全检查：确保路径在项目目录内
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  // 检查是否是目录
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
  }

  // 读取并返回文件
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.setHeader('Content-Type', contentType);
    res.writeHead(200);
    res.end(content);
  } catch (error) {
    console.error('读取文件失败:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`\n=== 精准就业服务平台服务器已启动 ===`);
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`按 Ctrl+C 停止服务器\n`);
});