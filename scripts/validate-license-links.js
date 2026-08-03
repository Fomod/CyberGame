const fs = require("fs");

const licensePage = "third-party-licenses.html";
const requiredTitle = "Third-Party Licenses - CyberGame";
const requiredHeading = "Third-Party Licenses";
const requiredLink = '<a href="/third-party-licenses.html">Third-Party Licenses</a>';
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function readPage(path) {
  if (!fs.existsSync(path)) {
    failures.push(`${path} is missing`);
    return null;
  }

  return fs.readFileSync(path, "utf8");
}

function finalFooterContainsLicenseLink(html) {
  const footerMatches = [...html.matchAll(/<footer\b[^>]*>/gi)];
  const finalFooter = footerMatches.at(-1);
  if (!finalFooter) return false;

  const footerStart = finalFooter.index;
  const footerEnd = html.toLowerCase().indexOf("</footer>", footerStart);
  const linkPosition = html.indexOf(requiredLink, footerStart);

  return footerEnd !== -1 && linkPosition !== -1 && linkPosition < footerEnd;
}

function privacyLinkFollowsContactInContainer(html) {
  const containerMatch = /<div\b[^>]*\bclass=(['"])[^'"]*\bcontainer\b[^'"]*\1[^>]*>/i.exec(html);
  if (!containerMatch) return false;

  const containerStart = containerMatch.index + containerMatch[0].length;
  const containerEnd = html.toLowerCase().indexOf("</div>", containerStart);
  if (containerEnd === -1) return false;

  const paragraphs = [...html.slice(containerStart, containerEnd).matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)].map((match) => match[0]);
  const contactParagraph = paragraphs.findIndex((paragraph) => paragraph.includes("mailto:contact@cybergame.ai"));
  const licenseParagraph = paragraphs.findIndex((paragraph) => paragraph.includes(requiredLink));

  return contactParagraph !== -1
    && licenseParagraph === contactParagraph + 1
    && licenseParagraph === paragraphs.length - 1;
}

const licenseHtml = readPage(licensePage);
if (licenseHtml !== null) {
  assert(
    licenseHtml.includes(`<title>${requiredTitle}</title>`),
    `${licensePage} title should be ${requiredTitle}`,
  );
  assert(
    licenseHtml.includes(`<h1>${requiredHeading}</h1>`),
    `${licensePage} heading should be ${requiredHeading}`,
  );
}

const indexHtml = readPage("index.html");
if (indexHtml !== null) {
  assert(
    finalFooterContainsLicenseLink(indexHtml),
    `index.html final footer should include ${requiredLink}`,
  );
}

const privacyHtml = readPage("privacy.html");
if (privacyHtml !== null) {
  assert(
    privacyLinkFollowsContactInContainer(privacyHtml),
    `privacy.html license link paragraph should follow the contact paragraph and be the final paragraph in the container`,
  );
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Validated third-party license page and source-page links.");
