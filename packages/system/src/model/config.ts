import img_role from '@src/asstes/img/icon/role.png'
import img_paimon from '@src/asstes/img/icon/paimon.png'
import img_question from '@src/asstes/img/icon/question.png'
import img_slime from '@src/asstes/img/icon/slime.png'
import img_team from '@src/asstes/img/icon/team.png'
import img_abyss from '@src/asstes/img/icon/abyss.png'
import img_weapon from '@src/asstes/img/icon/weapon.png'
import img_excel from '@src/asstes/img/icon/excel.png'
export default [
  {
    group: '系统管理',
    list: [
      { icon: img_role, title: '#更新日志', desc: '查看根目录git记录' },
      { icon: img_paimon, title: '#更新日志XXX', desc: '查看plugins/XXX的git目录' },
      { icon: img_abyss, title: '#运行日志', desc: '查看logs目录文件' },
      {
        icon: img_weapon,
        title: '#更新',
        desc: '也指定#更新XXX,可选组合(全部&强制&静默),如#全部更新'
      },
      { icon: img_question, title: '#重启', desc: '调用pm2.restart,可选(控制台&编译)' },
      { icon: img_excel, title: '#关机', desc: '调用exit()' },
      { icon: img_slime, title: '#状态', desc: '系统资料' }
    ]
  },
  {
    group: '依赖管理',
    list: [
      {
        icon: img_team,
        title: '#依赖配置',
        desc: '查看 package.json -> { dependencies:{} }'
      }
    ]
  }
]
