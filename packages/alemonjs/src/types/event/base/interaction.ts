/**
 * 跨平台交互事件的可确认标识。
 *
 * 平台适配器应保留该标识，应用可将其交给 `interaction.ack`。
 */
export type Interaction = {
  InteractionId: string;
  /** 平台提供的交互载荷；复杂结构仍保留在 `event.value`。 */
  InteractionData?: string;
  /** The destination that owns this interaction acknowledgement. */
  Target?: ActionTarget;
};
import type { ActionTarget } from '../../actions';
