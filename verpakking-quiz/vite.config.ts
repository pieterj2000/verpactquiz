import { defineConfig } from "vite";

// Custom Vite plugin to compile markdown files at build time (server-side)
function markdownPlugin() {
  return {
    name: "markdown-compile-plugin",
    transform(code, id) {
      if (id.endsWith(".md")) {
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

        return {
          code: `export default ${JSON.stringify(html)};`,
          map: null,
        };
      }
    },
  };
}

export default defineConfig({
  plugins: [markdownPlugin()],
});
