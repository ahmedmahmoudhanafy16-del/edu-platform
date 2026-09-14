const fs = require("fs");
const path = require("path");

const mdPath = path.join(__dirname, "..", "PLATFORM_MANUAL_A_TO_Z.md");
const mdContent = fs.readFileSync(mdPath, "utf8");

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>منصة التعليم الإلكتروني الذكية — Master Platform Manual (A to Z)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Fira+Code:wght@400;500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    :root {
      --bg: #FAFAF7;
      --card-bg: #FFFFFF;
      --text: #1C1917;
      --text-muted: #57534E;
      --primary: #0E7C7B;
      --primary-light: #F0FDFA;
      --border: #E7E5E4;
      --code-bg: #1C1917;
      --code-text: #38BDF8;
    }
    [data-theme="dark"] {
      --bg: #0C0A09;
      --card-bg: #1C1917;
      --text: #F5F5F4;
      --text-muted: #A8A29E;
      --primary: #14B8A6;
      --primary-light: #134E4A;
      --border: #292524;
      --code-bg: #000000;
      --code-text: #38BDF8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Cairo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.8;
      padding: 0;
      transition: background 0.2s, color 0.2s;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--card-bg);
      border-bottom: 1px solid var(--border);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .header-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
    }
    .btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-family: "Cairo", sans-serif;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .btn-secondary {
      background: var(--border);
      color: var(--text);
    }
    .container {
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 1.5rem 4rem 1.5rem;
    }
    article {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2.5rem 3rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
    }
    h1, h2, h3, h4 {
      color: var(--text);
      font-weight: 800;
      margin-top: 2rem;
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    h1 { font-size: 2.2rem; border-bottom: 2px solid var(--border); padding-bottom: 0.75rem; color: var(--primary); }
    h2 { font-size: 1.6rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    h3 { font-size: 1.25rem; }
    p, ul, ol { margin-bottom: 1.2rem; }
    li { margin-bottom: 0.4rem; margin-right: 1.5rem; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.95rem;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 0.75rem 1rem;
      text-align: right;
    }
    th {
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 700;
    }
    code {
      font-family: "Fira Code", monospace;
      font-size: 0.88em;
      background: var(--border);
      padding: 0.2em 0.4em;
      border-radius: 4px;
      direction: ltr;
      display: inline-block;
    }
    pre {
      background: var(--code-bg);
      color: var(--code-text);
      padding: 1.25rem;
      border-radius: 8px;
      overflow-x: auto;
      direction: ltr;
      text-align: left;
      margin: 1.5rem 0;
    }
    pre code {
      background: transparent;
      padding: 0;
      color: inherit;
      display: block;
    }
    blockquote {
      border-right: 4px solid var(--primary);
      padding-right: 1rem;
      color: var(--text-muted);
      margin: 1.5rem 0;
      background: var(--primary-light);
      padding: 0.75rem 1rem;
      border-radius: 4px 0 0 4px;
    }
    a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }
    a:hover { text-decoration: underline; }
    .mermaid {
      background: var(--card-bg);
      padding: 1.5rem;
      border-radius: 8px;
      margin: 1.5rem 0;
      text-align: center;
      border: 1px solid var(--border);
    }
    @media print {
      header { display: none; }
      .container { max-width: 100%; margin: 0; padding: 0; }
      article { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-title">
      <span>🎓</span>
      <span>دليل المنصة الشامل (Platform Manual A to Z)</span>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" onclick="toggleTheme()">🌓 الوضع الداكن</button>
      <button class="btn" onclick="window.print()">🖨️ طباعة / حفظ كـ PDF</button>
    </div>
  </header>
  <div class="container">
    <article id="content"></article>
  </div>
  <script>
    mermaid.initialize({ startOnLoad: false, theme: "neutral" });
    const rawMd = ${JSON.stringify(mdContent)};
    document.getElementById("content").innerHTML = marked.parse(rawMd);
    
    document.querySelectorAll("pre code.language-mermaid").forEach((el) => {
      const parent = el.parentElement;
      const mermaidDiv = document.createElement("div");
      mermaidDiv.className = "mermaid";
      mermaidDiv.textContent = el.textContent;
      parent.replaceWith(mermaidDiv);
    });
    mermaid.run();

    function toggleTheme() {
      const current = document.documentElement.getAttribute("data-theme");
      document.documentElement.setAttribute("data-theme", current === "dark" ? "light" : "dark");
    }
  </script>
</body>
</html>`;

const destDownloads = "C:/Users/Hanafy/Downloads/PLATFORM_MANUAL_A_TO_Z.html";
fs.writeFileSync(destDownloads, html, "utf8");
console.log("Successfully generated:", destDownloads);
