export type QQTextSanitizerOptions = {
  /** Strip only this bot by default. Other users' mentions retain meaning. */
  botMention?: 'remove' | 'preserve';
  otherMentions?: 'remove' | 'preserve';
  faces?: 'preserve' | 'remove' | 'label';
  /** Disabled by default to preserve paragraphs and code indentation. */
  collapseWhitespace?: boolean;
};

/** Converts QQ protocol markup, never HTML. Raw event content is preserved. */
export const sanitizeQQText = (text: string, botId: string, options: QQTextSanitizerOptions = {}) => {
  let result = text.replace(/<@!?([^>\s]+)>/g, (marker, id: string) => {
    const remove = id === botId ? options.botMention !== 'preserve' : options.otherMentions === 'remove';

    return remove ? '' : marker;
  });
  const faces = options.faces ?? 'preserve';

  if (faces !== 'preserve') {
    result = result.replace(/\[<face,id=(\d+)\/?>\]/g, (_marker, id: string) => (faces === 'label' ? `[表情:${id}]` : ''));
    result = result.replace(/<faceType=\d+,faceId="([^"]*)",ext="([^"]*)">/g, (_marker, id: string, ext: string) => {
      if (faces === 'remove') {
        return '';
      }
      try {
        if (ext.length <= 10000) {
          const data = JSON.parse(Buffer.from(ext, 'base64').toString('utf8'));

          if (typeof data?.text === 'string' && data.text) {
            return `[表情:${data.text.slice(0, 100)}]`;
          }
        }
      } catch {
        // Malformed optional face metadata falls back to its protocol ID.
      }

      return `[表情:${id}]`;
    });
  }
  if (options.collapseWhitespace) {
    result = result.replace(/\s+/g, ' ');
  }

  return result.trim();
};
