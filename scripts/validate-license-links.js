const fs = require("fs");

const licensePage = "third-party-licenses.html";
const requiredTitle = "Third-Party Licenses";
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

function bottomContent(html) {
  return html.slice(Math.floor(html.length * 0.75));
}

const licenseHtml = readPage(licensePage);
if (licenseHtml) {
  assert(
    licenseHtml.includes(`<title>${requiredTitle}</title>`),
    `${licensePage} title should be ${requiredTitle}`,
  );
  assert(
    licenseHtml.includes(`<h1>${requiredHeading}</h1>`),
    `${licensePage} heading should be ${requiredHeading}`,
  );
}

for (const sourcePage of ["index.html", "privacy.html"]) {
  const sourceHtml = readPage(sourcePage);
  if (sourceHtml) {
    assert(
      bottomContent(sourceHtml).includes(requiredLink),
      `${sourcePage} bottom content should include ${requiredLink}`,
    );
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Validated third-party license page and source-page links.");
