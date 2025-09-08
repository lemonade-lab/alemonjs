import { Ark, useMessage } from 'alemonjs';
export const selects = onSelects(['message.create']);
export default onResponse(selects, event => {
  const [message] = useMessage(event);

  // 普通卡片
  message.send(
    format(
      Ark.Card({
        decs: '你是谁',
        title: '收你来啦',
        prompt: '通知信息！！',
        metadecs: '阿柠檬2正式版发送',
        cover: 'https://pub.idqqimg.com/pc/misc/files/20190820/2f4e70ae3355ece23d161cf5334d4fc1jzjfmtep.png',
        link: '',
        subtitle: '赞赞赞'
      })
    )
  );

  // 大图卡片
  message.send(
    format(
      Ark.BigCard({
        title: '收你来啦',
        prompt: '通知信息！！',
        cover: 'https://pub.idqqimg.com/pc/misc/files/20190820/2f4e70ae3355ece23d161cf5334d4fc1jzjfmtep.png',
        link: '',
        subtitle: '赞赞赞'
      })
    )
  );

  // 列表
  message.send(
    format(
      Ark.list(
        Ark.listTip({
          desc: '状态扭转',
          prompt: '状态扭转'
        }),
        Ark.listContent(
          Ark.listItem('需求标题：UI问题解决'),
          Ark.listItem('点击下列动作直接扭转状态到：'),
          Ark.listItem({
            title: '状态1',
            link: 'https://alemonjs.com?status=1'
          }),
          Ark.listItem({
            title: '状态2',
            link: 'https://alemonjs.com?status=2'
          }),
          Ark.listItem('请关注')
        )
      )
    )
  );
});
