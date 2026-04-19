import { DataButtonGroup } from './button';
import { DataMarkDown } from './markdown';
import { DataImage, DataImageFile, DataImageURL } from './image';
import { DataText } from './text';
import { DataMention } from './mention';
import { DataLink } from './link';
import { DataAttachment } from './attachment';
import { DataAudio } from './audio';
import { DataVideo } from './video';
import { DataMarkdownOriginal } from './markdown-raw';
import { DataSelect } from './select';
import { DataEmbed } from './embed';

// text
export * from './text';

export * from './link';

// mention
export * from './mention';

// image
export * from './image';

// button
export * from './button';

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

// select
export * from './select';

// embed
export * from './embed';

// enums
export type DataEnums =
  | DataText
  | DataLink
  | DataImage
  | DataImageURL
  | DataImageFile
  | DataMention
  | DataButtonGroup
  | DataMarkDown
  | DataMarkdownOriginal
  | DataAttachment
  | DataAudio
  | DataVideo
  | DataSelect
  | DataEmbed;

// 消息数据格式
export type MessageDataFormat = DataEnums[];
