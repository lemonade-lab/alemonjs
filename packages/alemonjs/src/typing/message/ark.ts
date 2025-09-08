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
