import { DataButtonGroup, DataButtonTemplate } from './button';
import { DataArkBigCard, DataArkCard, DataArkList } from './ark';
import { DataMarkDown, DataMarkdownTemplate, DataCustom } from './markdown';
import { DataImage, DataImageFile, DataImageURL } from './image';
import { DataText } from './text';
import { DataMention } from './mention';
import { DataLink } from './link';
import { DataAttachment } from './attachment';
import { DataAudio } from './audio';
import { DataVideo } from './video';
import { DataMarkdownOriginal } from './markdown-raw';

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

// markdown raw
export * from './markdown-raw';

// attachment
export * from './attachment';

// audio
export * from './audio';

// video
export * from './video';

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
  | DataMarkdownTemplate
  | DataMarkdownOriginal
  | DataAttachment
  | DataAudio
  | DataVideo
  | DataCustom;

// 消息数据格式
export type MessageDataFormat = DataEnums[];
