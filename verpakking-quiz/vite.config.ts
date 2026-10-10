import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

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
            html += `<h3 style="margin-bottom: 1rem; color: var(--primary-dark);">${line.replace("# ", "")}</h3>`;
          } else if (line.startsWith("## ")) {
            if (inParagraph) {
              html += "</p>";
              inParagraph = false;
            }
            html += `<h4>${line.replace("## ", "")}</h4>`;
          } else {
            if (!inParagraph) {
              html += '<p style="margin-bottom: 1rem; line-height: 1.6;">';
              inParagraph = true;
            } else {
              html += "<br>";
            }
            const formatted = line
              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
              .replace(/_(.*?)_/g, "<em>$1</em>");
            html += formatted;
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
