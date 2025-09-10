import { DataButtonGroup, DataButtonTemplate } from './button';
import { DataArkBigCard, DataArkCard, DataArkList } from './ark';
import { DataMarkDown, DataMarkdownTemplate } from './markdown';
import { DataImage, DataImageFile, DataImageURL } from './image';
import { DataText } from './text';
import { DataMention } from './mention';
import { DataLink } from './link';

// text
export * from './text';

export * from './link';

// mention
export * from './mention';

// image
export * from './image';

// button
export * from './button';

// ark
export * from './ark';

// md
export * from './markdown';

// enums
export type DataEnums =
  | DataText
  | DataLink
  | DataImage
  | DataImageURL
  | DataImageFile
  | DataMention
  | DataButtonGroup
  | DataButtonTemplate
  | DataArkList
  | DataArkCard
  | DataArkBigCard
  | DataMarkDown
  | DataMarkdownTemplate;

// 消息数据格式
export type MessageDataFormat = DataEnums[];
