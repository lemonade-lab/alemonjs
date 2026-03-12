/**
 * QQ-Bot 平台专用类型定义
 * 这些类型仅在 QQ-Bot 平台使用，不属于框架标准格式
 */

// ==================== Ark 类型 ====================

export type DataArkListTip = {
  type: 'Ark.listTip';
  value: {
    desc: string;
    prompt: string;
  };
};

export type DataArkListItem = {
  type: 'Ark.listItem';
  value: string | { title: string; link: string };
};

export type DataArkListContent = {
  type: 'Ark.listContent';
  value: DataArkListItem[];
};

export type DataArkList = {
  type: 'Ark.list';
  value: [DataArkListTip, DataArkListContent];
};

export type DataArkCard = {
  type: 'Ark.Card';
  value: {
    title: string;
    cover: string;
    link: string;
    subtitle: string;
    decs: string;
    prompt: string;
    metadecs: string;
  };
};

export type DataArkBigCard = {
  type: 'Ark.BigCard';
  value: {
    title: string;
    subtitle: string;
    cover: string;
    link: string;
    prompt: string;
  };
};

// ==================== 模板类型 ====================

/**
 * 按钮模板数据
 * value 为 QQ Bot 平台侧的模板 ID
 */
export type DataButtonTemplate = {
  type: 'ButtonTemplate';
  value: string;
};
