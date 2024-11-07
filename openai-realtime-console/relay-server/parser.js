import { marked } from "marked";
import fs from "fs";
import { JSDOM } from "jsdom";
export function parseMarkdown(text) {
  return marked(text);
}

const markdown = fs.readFileSync('schemes.md', 'utf-8');

const result = parseMarkdown(markdown);
console.log(result);

function markdownToJson(markdown) {
  const dom = new JSDOM(marked(markdown));
  const document = dom.window.document;
  const json = {};

  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((header) => {
    const level = header.tagName.toLowerCase();
    const text = header.textContent;
    json[text] = { level, content: [] };

    let sibling = header.nextElementSibling;
    while (sibling && !sibling.tagName.toLowerCase().startsWith('h')) {
      json[text].content.push(sibling.outerHTML);
      sibling = sibling.nextElementSibling;
    }
  });

  return json;
}

const jsonResult = markdownToJson(fs.readFileSync('schemes.md', 'utf-8'));
console.log(JSON.stringify(jsonResult, null, 2));