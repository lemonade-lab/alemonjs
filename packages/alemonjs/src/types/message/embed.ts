export type DataEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type DataEmbedAuthor = {
  name: string;
  url?: string;
  iconUrl?: string;
};

export type DataEmbedFooter = {
  text: string;
  iconUrl?: string;
};

/**
 * 富媒体卡片
 * - Discord: Embed
 * - KOOK: Card
 * - QQ: Ark
 * - 其它平台: 可降级为纯文本
 */
export type DataEmbed = {
  type: 'Embed';
  value: {
    title?: string;
    description?: string;
    url?: string;
    color?: number;
    image?: string;
    thumbnail?: string;
    author?: DataEmbedAuthor;
    footer?: DataEmbedFooter;
    fields?: DataEmbedField[];
    timestamp?: string | number | Date;
  };
};
