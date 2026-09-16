/** SDK imports are silent; applications may opt in to diagnostics. */
export interface SdkLogger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

let sink: Partial<SdkLogger> = {};

export function setSdkLogger(value: Partial<SdkLogger>): void {
  sink = value;
}

export const logger: SdkLogger = {
  debug: message => sink.debug?.(message),
  info: message => sink.info?.(message),
  warn: message => sink.warn?.(message),
  error: message => sink.error?.(message)
};
