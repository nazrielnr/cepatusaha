const OPEN = '<think>';
const CLOSE = '</think>';

const suffixPrefix = (text, tag) => {
  for (let n = Math.min(text.length, tag.length - 1); n > 0; n--) {
    const suffix = text.slice(-n);
    if (tag.startsWith(suffix)) return suffix;
  }
  return '';
};

export function createThinkingTagParser() {
  let thinking = false;
  let buffer = '';

  const push = (out, content) => {
    if (content) out.push({ type: thinking ? 'thinking' : 'text', content });
  };

  return {
    feed(chunk) {
      buffer += chunk;
      const out = [];

      while (buffer) {
        const tag = thinking ? CLOSE : OPEN;
        const index = buffer.indexOf(tag);

        if (index !== -1) {
          push(out, buffer.slice(0, index));
          buffer = buffer.slice(index + tag.length);
          thinking = !thinking;
          continue;
        }

        const keep = suffixPrefix(buffer, tag);
        push(out, buffer.slice(0, buffer.length - keep.length));
        buffer = keep;
        break;
      }

      return out;
    },

    flush() {
      const out = [];
      push(out, buffer);
      buffer = '';
      return out;
    },
  };
}
