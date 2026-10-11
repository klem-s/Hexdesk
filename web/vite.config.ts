import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Hexdesk embeds this build as one self-contained HTML file via go:embed and
// hands it straight to WebView2's SetHtml — no bundled assets, no local
// HTTP server. viteSingleFile inlines JS/CSS into dist/index.html for that.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
})
