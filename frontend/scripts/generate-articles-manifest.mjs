import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.resolve(__dirname, '../public/articles');
const MANIFEST_PATH = path.join(ARTICLES_DIR, 'manifest.json');

function humanizeId(id) {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractLinksFromText(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? matches.map(url => url.trim()) : [];
}

async function extractFromDocx(docxPath) {
  try {
    const { value } = await mammoth.extractRawText({ path: docxPath });
    const allLines = value.split('\n').map(l => l.trim());
    
    const nonEmptyLines = allLines.filter(line => line !== '');
    
    if (nonEmptyLines.length === 0) {
      const id = path.basename(docxPath, '.docx');
      return { 
        description: '', 
        contentLines: [],
        links: []
      };
    }
    
    const contentLines = nonEmptyLines;
    const fullText = nonEmptyLines.join(' ');
    const links = extractLinksFromText(fullText);
    
    return { 
      description: '', 
      contentLines,
      links
    };
  } catch (error) {
    return { 
      description: '', 
      contentLines: [],
      links: []
    };
  }
}

function readSidecarMeta(id) {
  const metaPath = path.join(ARTICLES_DIR, `${id}.meta.json`);
  if (!fs.existsSync(metaPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  } catch (err) {
    console.warn(`[articles] Не удалось прочитать ${metaPath}:`, err.message);
    return null;
  }
}

async function buildManifest() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  }

  const docxFiles = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.docx'))
    .sort();

  const articles = [];

  for (const fileName of docxFiles) {
    const id = path.basename(fileName, '.docx');
    const docxPath = path.join(ARTICLES_DIR, fileName);
    const sidecar = readSidecarMeta(id);
    const extracted = await extractFromDocx(docxPath);

    const title = sidecar?.title ?? humanizeId(id);
    const description = sidecar?.description ?? extracted.description;
    const links = sidecar?.links ?? extracted.links;
    
    let contentFile = null;
    if (extracted.contentLines.length > 0) {
      const contentPath = path.join(ARTICLES_DIR, `${id}.content.txt`);
      fs.writeFileSync(contentPath, extracted.contentLines.join('\n'), 'utf-8');
      contentFile = `${id}.content.txt`;
    }

    articles.push({
      id,
      title,
      description,
      keyPoints: sidecar?.keyPoints ?? [],
      fileName,
      order: sidecar?.order ?? 999,
      links,
      contentFile,
    });
  }

  articles.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ru'));

  const manifest = {
    generatedAt: new Date().toISOString(),
    articles: articles.map(({ order, contentFile, ...rest }) => ({
      ...rest,
      ...(contentFile && { contentFile }),
    })),
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[articles] manifest.json: ${articles.length} статей`);
}

buildManifest().catch((err) => {
  console.error('[articles] Ошибка генерации manifest:', err);
  process.exit(1);
});