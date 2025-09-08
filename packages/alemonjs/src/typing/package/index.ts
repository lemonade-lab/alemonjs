export type Package = {
  [key: string]: any;
  name: string | null;
  version: string | null;
  description: string | null;
  author: string | null;
  license: string | null;
  type: string | null;
  private: boolean | null;
};
