import { BT, MD, useMessage } from 'alemonjs';

export const regular = /^(#|\/)?按钮测试$/;

const selects = onSelects(['message.create', 'private.message.create']);
const response = onResponse(selects, event => {
  const [message] = useMessage(event);

  // 多行多个
  message.send(
    format(
      MD(
        MD.text('普通文本'),
        // 标题
        MD.title('标题！！'),
        // 副标题
        MD.subtitle('子标题'),
        // 加粗
        MD.bold('加粗'),
        // 斜体
        MD.italic('斜体'),
        // 星号斜体
        MD.italicStar('星号斜体'),
        // 删除线
        MD.strikethrough('删除线'),
        // 链接
        MD.link('链接', 'https://www.baidu.com'),
        // 图片
        MD.image('https://www.baidu.com/img/bd_logo1.png', {
          width: 100,
          height: 100
        }),
        // 有序列表
        MD.list(MD.listItem(1, '有序列表'), MD.listItem(2, '有序列表'), MD.listItem(3, '有序列表'), MD.listItem(4, '有序列表')),
        // 无序列表
        MD.list(MD.listItem('无序列表'), MD.listItem('无序列表'), MD.listItem('无序列表'), MD.listItem('无序列表'), MD.listItem('无序列表')),
        // 块引用
        MD.blockquote('块引用'),
        // 水平分割线
        MD.divider(),
        // 换行
        MD.newline(),
        // 换多行
        MD.newline(true),
        MD.bold(`const res = onResponse(event,aynsc (event) => {})`)
      ),
      BT.group(BT.row(BT('开始', '/开始游戏', { autoEnter: true }), BT('结束', '/结束游戏')), BT.row(BT('退出', '/退出游戏'), BT('注销', '/注销账户')))
    )
  );
});
export default response;
