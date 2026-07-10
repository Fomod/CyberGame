const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const sitemap = fs.readFileSync("sitemap.xml", "utf8");
const robots = fs.readFileSync("robots.txt", "utf8");
const ai = fs.readFileSync("ai.txt", "utf8");
const wellKnownAi = fs.readFileSync(".well-known/ai.txt", "utf8");
const agents = fs.readFileSync("agents.txt", "utf8");
const wellKnownAgents = fs.readFileSync(".well-known/agents.txt", "utf8");
const llms = fs.readFileSync("llms.txt", "utf8");
const wellKnownLlms = fs.readFileSync(".well-known/llms.txt", "utf8");
const readme = fs.existsSync("README.md") ? fs.readFileSync("README.md", "utf8") : "";

const failures = [];
const productSitemapIndexes = [
  "https://html.cybergame.ai/sitemap-index.xml",
  "https://markdown.cybergame.ai/sitemap-index.xml",
];
const githubPublisherProfile = "https://github.com/Fomod";
const productRepositories = {
  "Html Preview - Web File Viewer": "https://github.com/Fomod/html.cybergame.ai",
  "Md Preview - Markdown Viewer": "https://github.com/Fomod/markdown.cybergame.ai",
};

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function collectJsonLd(value, out = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLd(item, out);
    return out;
  }
  if (value["@type"]) out.push(value);
  if (Array.isArray(value["@graph"])) collectJsonLd(value["@graph"], out);
  return out;
}

function hasType(node, typeName) {
  const type = node && node["@type"];
  return Array.isArray(type) ? type.includes(typeName) : type === typeName;
}

const descriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
assert(descriptionMatch, "homepage is missing meta description");
if (descriptionMatch) {
  const description = descriptionMatch[1].trim();
  assert(description.length >= 80 && description.length <= 180, "homepage meta description should be 80-180 characters");
  assert(/HTML/i.test(description) && /Markdown/i.test(description) && /iPhone/i.test(description), "homepage meta description should mention HTML, Markdown, and iPhone");
}

const scriptBodies = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
assert(scriptBodies.length > 0, "homepage is missing JSON-LD markup");

let nodes = [];
for (const [index, body] of scriptBodies.entries()) {
  try {
    nodes = nodes.concat(collectJsonLd(JSON.parse(body)));
  } catch (error) {
    failures.push(`homepage JSON-LD block ${index + 1} is invalid JSON: ${error.message}`);
  }
}

const requiredTypes = ["Organization", "WebSite", "WebPage", "FAQPage", "SoftwareApplication", "MobileApplication"];
for (const typeName of requiredTypes) {
  assert(nodes.some((node) => hasType(node, typeName)), `homepage JSON-LD is missing ${typeName}`);
}

const website = nodes.find((node) => hasType(node, "WebSite"));
const webpage = nodes.find((node) => hasType(node, "WebPage"));
const organization = nodes.find((node) => hasType(node, "Organization"));
assert(website && /^\d{4}-\d{2}-\d{2}$/.test(website.dateModified || ""), "WebSite schema is missing ISO dateModified");
assert(webpage && /^\d{4}-\d{2}-\d{2}$/.test(webpage.dateModified || ""), "WebPage schema is missing ISO dateModified");
assert(organization?.sameAs?.includes(githubPublisherProfile), "Organization schema should expose the official GitHub publisher profile");
assert(html.includes(`href="${githubPublisherProfile}" data-publisher-profile-link="true"`), "homepage should visibly link the official GitHub publisher profile");

for (const [appName, repositoryUrl] of Object.entries(productRepositories)) {
  const app = nodes.find((node) => hasType(node, "SoftwareApplication") && node.name === appName);
  assert(app?.sameAs?.includes(repositoryUrl), `${appName} schema should expose its official GitHub repository`);
}

if (website && webpage && website.dateModified && webpage.dateModified) {
  assert(website.dateModified === webpage.dateModified, "WebSite and WebPage dateModified should match");
  const homepageSitemapMatch = sitemap.match(/<loc>https:\/\/cybergame\.ai\/<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/);
  assert(homepageSitemapMatch, "sitemap is missing homepage lastmod");
  if (homepageSitemapMatch) {
    assert(homepageSitemapMatch[1] === webpage.dateModified, "homepage sitemap lastmod should match WebPage dateModified");
  }
}

for (const productSitemapIndex of productSitemapIndexes) {
  assert(robots.includes(`Sitemap: ${productSitemapIndex}`), `robots.txt should expose product sitemap index ${productSitemapIndex}`);
  for (const [label, text] of [
    ["ai.txt", ai],
    [".well-known/ai.txt", wellKnownAi],
    ["agents.txt", agents],
    [".well-known/agents.txt", wellKnownAgents],
    ["llms.txt", llms],
    [".well-known/llms.txt", wellKnownLlms],
  ]) {
    assert(text.includes(productSitemapIndex), `${label} should expose product sitemap index ${productSitemapIndex}`);
  }
}

for (const [label, text] of [
  ["README.md", readme],
  ["ai.txt", ai],
  [".well-known/ai.txt", wellKnownAi],
  ["agents.txt", agents],
  [".well-known/agents.txt", wellKnownAgents],
  ["llms.txt", llms],
  [".well-known/llms.txt", wellKnownLlms],
]) {
  assert(text.includes(githubPublisherProfile), `${label} should expose the official GitHub publisher profile`);
  for (const repositoryUrl of Object.values(productRepositories)) {
    assert(text.includes(repositoryUrl), `${label} should expose official product repository ${repositoryUrl}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Validated CyberGame homepage metadata: ${scriptBodies.length} JSON-LD blocks, ${nodes.length} typed nodes.`);
