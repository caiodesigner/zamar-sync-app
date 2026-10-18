import { DEFAULT_THEME, slideGeometry, type Theme } from './content';
// Conservative pagination shares canonical geometry, font and margins with the renderer.
// Up to 36 display cells per line and 8 lines, reduced for larger fonts or margins.
const graphemes = new Intl.Segmenter('pt-BR', { granularity:'grapheme' });
export function slidesForText(text: string, theme:Theme = DEFAULT_THEME): string[] {
  const geometry = slideGeometry(theme);
  const columns = Math.max(8,Math.min(36,Math.floor(geometry.innerWidth/(theme.fontSize*(theme.font==='mono'?0.72:1)))));
  const limit = Math.max(1,Math.min(8,Math.floor(geometry.innerHeight/(theme.fontSize*1.25))));
  const pages: string[] = [];
  for (const part of text.replace(/\r\n?/g,'\n').replace(/\t/g,'    ').replace(/^[ \t]*---[ \t]*$/gm,'\n').split(/\n[ \t]*\n(?:[ \t]*\n)*/)) {
    let lines: string[] = [];
    const flush = () => { if (lines.some(line => line.trim())) pages.push(lines.join('\n')); lines = []; };
    for (const line of part.split('\n')) {
      const chars = [...graphemes.segment(line)].map(s => s.segment);
      if (!chars.length) lines.push('');
      let offset = 0;
      while (offset < chars.length) {
        // CJK and emoji can occupy two monospace cells. Use a conservative limit.
        let cells = 0; let take = 0;
        for (let index=offset; index<chars.length; index++) { const char=chars[index]; const width = /[^\u0000-\u024f\u0300-\u036f]/u.test(char) ? 2 : 1; if (cells + width > columns) break; cells += width; take++; }
        let end = Math.max(1,take);
        if (offset + end < chars.length) { const space = chars.slice(offset,offset+end).lastIndexOf(' '); if (space > end / 2) end = space + 1; }
        lines.push(chars.slice(offset,offset+end).join('')); offset += end;
        if (lines.length === limit) flush();
      }
      if (lines.length === limit) flush();
    }
    flush();
  }
  return pages;
}
