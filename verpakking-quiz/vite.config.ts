import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

function formatInline(text: string): string {
  return (
    text
      // Links: [text](url) -> <a href="url" target="_blank" rel="noopener noreferrer">text</a>
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">$1</a>',
      )
      // Bold: **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic: _text_ -> <em>text</em>
      .replace(/_(.*?)_/g, "<em>$1</em>")
      // Italic: *text* -> <em>text</em>
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
  );
}

// Virtual module plugin to compile tekstje.md at build time (server-side)
function markdownVirtualPlugin() {
  const virtualModuleId = "virtual:tekst-html";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "markdown-virtual-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const mdPath = path.resolve(import.meta.dirname, "src/tekstje.md");
        const code = fs.readFileSync(mdPath, "utf-8");

        const lines = code.split("\n");
        let html = "";
        let inParagraph = false;

        for (let line of lines) {
          line = line.trim();
          if (!line) {
            if (inParagraph) {
              html += "</p>";
              inParagraph = false;
            }
            continue;
          }

          if (line.startsWith("# ")) {
            if (inParagraph) {
              html += "</p>";
              inParagraph = false;
            }
            const formattedHeader = formatInline(line.replace("# ", ""));
            html += `<h3 style="margin-bottom: 1rem; color: var(--primary-dark);">${formattedHeader}</h3>`;
          } else if (line.startsWith("## ")) {
            if (inParagraph) {
              html += "</p>";
              inParagraph = false;
            }
            const formattedHeader = formatInline(line.replace("## ", ""));
            html += `<h4>${formattedHeader}</h4>`;
          } else {
            if (!inParagraph) {
              html += '<p style="margin-bottom: 1rem; line-height: 1.6;">';
              inParagraph = true;
            } else {
              html += "<br>";
            }
            html += formatInline(line);
          }
        }
        if (inParagraph) {
          html += "</p>";
        }

        return `export default ${JSON.stringify(html)};`;
      }
    },
  };
}

export default defineConfig({
  plugins: [markdownVirtualPlugin()],
});
