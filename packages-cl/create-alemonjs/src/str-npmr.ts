export default `# 为项目单独设置镜像
registry=https://registry.npmmirror.com
# 不生成lock
package-lock=false
# 改为 npm 依赖安装方式
node-linker=hoisted
# 可耻的提升
shamefully-hoist=true
# 严格的对等依赖关系
strict-peer-dependencies=false`;
