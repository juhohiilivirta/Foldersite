const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const root = __dirname;
const publicDir = path.join(root, 'public');
const port = Number(process.env.PORT || 3000);
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function safePath(relativePath) {
  const resolved = path.resolve(root, relativePath);
  return resolved.startsWith(root + path.sep) ? resolved : null;
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim();
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function getContent() {
  const rootEntries = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'));

  const aboutFolder = rootEntries.find((entry) => {
    const dirPath = path.join(root, entry.name);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return false;
    }

    const dirEntries = fs.readdirSync(dirPath, { withFileTypes: true });
    return dirEntries.some((item) => item.isFile() && path.extname(item.name).toLowerCase() === '.txt');
  });

  const aboutPath = aboutFolder ? path.join(root, aboutFolder.name) : path.join(root, 'about');
  const projectsFolder = rootEntries.find((entry) => entry.name !== 'public' && entry.name !== aboutFolder?.name);
  const projectsPath = projectsFolder ? path.join(root, projectsFolder.name) : null;
  const aboutFiles = fs.existsSync(aboutPath) ? listFiles(aboutPath) : [];
  const textFiles = aboutFiles.filter((file) => path.extname(file).toLowerCase() === '.txt');
  const footerFile = textFiles.find((file) => path.basename(file, path.extname(file)).toLowerCase() === 'footer') || null;
  const aboutFile = textFiles.find((file) => file !== footerFile) || null;
  const aboutImages = aboutFiles
    .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
    .map((file) => `/content/${encodeURIComponent(aboutFolder ? aboutFolder.name : 'about')}/${encodeURIComponent(file)}`);
  const projects = projectsPath && fs.existsSync(projectsPath)
    ? fs.readdirSync(projectsPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => {
        const projectPath = path.join(projectsPath, entry.name);
        const files = listFiles(projectPath);
        const textFile = files.find((file) => path.extname(file).toLowerCase() === '.txt');

        return {
          id: entry.name,
          textTitle: textFile ? path.basename(textFile, path.extname(textFile)) : '',
          text: textFile ? readText(path.join(projectPath, textFile)) : '',
          images: files
            .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
            .map((file) => `/content/${encodeURIComponent(projectsFolder.name)}/${entry.name}/${encodeURIComponent(file)}`)
        };
      })
    : [];

  return {
    aboutTitle: aboutFolder ? aboutFolder.name : '',
    about: aboutFile ? readText(path.join(aboutPath, aboutFile)) : '',
    footer: footerFile ? readText(path.join(aboutPath, footerFile)) : '',
    aboutImages,
    projectsTitle: projectsFolder ? projectsFolder.name : '',
    projects
  };
}

function send(response, status, body, type) {
  response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  response.end(body);
}

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(url.parse(request.url).pathname);

  if (pathname === '/api/content') {
    return send(response, 200, JSON.stringify(getContent()), 'application/json; charset=utf-8');
  }

  if (pathname.startsWith('/content/')) {
    const filePath = safePath(pathname.slice('/content/'.length));
    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return send(response, 200, fs.readFileSync(filePath), `image/${path.extname(filePath).slice(1).replace('jpg', 'jpeg')}`);
    }
  }

  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = safePath(path.join('public', file));
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const type = path.extname(filePath) === '.css' ? 'text/css' : path.extname(filePath) === '.js' ? 'text/javascript' : 'text/html';
    return send(response, 200, fs.readFileSync(filePath), `${type}; charset=utf-8`);
  }

  send(response, 404, 'Not found', 'text/plain; charset=utf-8');
});

server.listen(port, () => {
  console.log(`Foldersite is running at http://localhost:${port}`);
});