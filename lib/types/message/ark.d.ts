//#region src/types/message/ark.d.ts
type DataArkListTip = {
  type: 'Ark.listTip';
  value: {
    desc: string;
    prompt: string;
  };
};
type DataArkListItem = {
  type: 'Ark.listItem';
  value: string | {
    title: string;
    link: string;
  };
};
type DataArkListContent = {
  type: 'Ark.listContent';
  value: DataArkListItem[];
};
type DataArkList = {
  type: 'Ark.list';
  value: [DataArkListTip, DataArkListContent];
};
type DataArkCard = {
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
type DataArkBigCard = {
  type: 'Ark.BigCard';
  value: {
    title: string;
    subtitle: string;
    cover: string;
    link: string;
    prompt: string;
  };
};
//#endregion
export { DataArkBigCard, DataArkCard, DataArkList, DataArkListContent, DataArkListItem, DataArkListTip };