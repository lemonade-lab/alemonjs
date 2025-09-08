import * as alemonjs from 'alemonjs';
import { existsSync, readFileSync, watch } from 'fs';
import { parse } from 'yaml';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  watch: jest.fn()
}));

jest.mock('yaml', () => ({
  parse: jest.fn()
}));

describe('ConfigCore', () => {
  let config;

  beforeEach(() => {
    // 初始化配置对象
    config = new alemonjs.ConfigCore('alemon.config.yaml');
  });

  afterEach(() => {
    jest.clearAllMocks(); // 清除所有模拟的调用
  });

  it('should read config file correctly', () => {
    // 模拟文件存在并返回内容
    const mockData = `
      key: value
    `;
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(mockData);
    (parse as jest.Mock).mockReturnValue({ key: 'value' });

    const value = config.value;

    expect(value).toEqual({ key: 'value' });
    expect(existsSync).toHaveBeenCalledWith(expect.any(String)); // 不关心路径
    expect(readFileSync).toHaveBeenCalledWith(expect.any(String), 'utf-8');
    expect(parse).toHaveBeenCalledWith(mockData);
  });

  it('should return default value when config file does not exist', () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    const value = config.value;

    expect(value).toBeNull(); // 默认值为空
  });

  it('should handle error in YAML parsing', () => {
    const mockData = `
      key: value
    `;
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(mockData);
    (parse as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid YAML');
    });

    const value = config.value;

    expect(value).toBeNull(); // 如果解析出错，应该返回 null
  });

  it('should watch config file for changes', () => {
    const mockData = `
      key: value
    `;
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(mockData);
    (parse as jest.Mock).mockReturnValue({ key: 'value' });

    // 调用 update 方法后，模拟 watch 事件
    config.value; // 触发更新
    expect(watch).toHaveBeenCalled();
    expect(watch).toHaveBeenCalledWith(expect.any(String), expect.any(Function));
  });

  it('should parse command line arguments correctly', () => {
    // 模拟 process.argv
    process.argv = ['node', 'index.js', '--key', 'value', '--flag'];

    const argv = config.argv;

    expect(argv).toEqual({
      key: 'value',
      flag: true
    });
  });

  it('should return package.json contents', () => {
    const mockPackageData = '{"name": "test-package", "version": "1.0.0"}';
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(mockPackageData);

    const packageData = config.package;

    expect(packageData).toEqual(JSON.parse(mockPackageData));
    expect(existsSync).toHaveBeenCalledWith(expect.any(String));
    expect(readFileSync).toHaveBeenCalledWith(expect.any(String), 'utf-8');
  });

  it('should return null if package.json does not exist', () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    const packageData = config.package;

    expect(packageData).toBeNull();
  });

  it('should log a warning if package.json is not found', () => {
    const mockWarn = jest.fn();
    console.warn = mockWarn;
    (existsSync as jest.Mock).mockReturnValue(false);

    config.package;

    expect(mockWarn).toHaveBeenCalledWith('package.json not found');
  });
});
