# NPC 角色列表

NPC roster 定义“角色”，地图中的 NPC placement 只引用角色 id 和所在位置。

## 字段

- `id`: 稳定 id。
- `name`: 展示名称。
- `role`: 角色定位。
- `defaultAppearanceTime`: 默认可见时间。
- `tags`: 搜索和筛选标签。
- `shortDescription`: Inspector 简述。
- `radarHint`: 雷达发现时的默认提示。
- `defaultDialogueId`: 默认对话。

## 首批角色

### npc-gatekeeper

- name: 门卫艾伦
- role: 入口守卫
- defaultAppearanceTime: Always
- tags: `guard`, `guide`
- shortDescription: 负责引导玩家进入区域，并提示夜间危险。
- radarHint: 附近传来钥匙碰撞声。
- defaultDialogueId: `dialogue-gatekeeper-intro`

### npc-clockmaker

- name: 钟表匠米拉
- role: 隐藏线索 NPC
- defaultAppearanceTime: Night
- tags: `clue`, `night`, `mechanic`
- shortDescription: 只在夜晚出现，知道钟楼异常的线索。
- radarHint: 北侧传来微弱机械声。
- defaultDialogueId: `dialogue-clockmaker-rumor`

### npc-market-scout

- name: 集市斥候罗恩
- role: 雷达教学 NPC
- defaultAppearanceTime: Day
- tags: `scout`, `tutorial`
- shortDescription: 向 GM 或玩家解释雷达扫描的使用方式。
- radarHint: 人群里有人正在观察你。
- defaultDialogueId: `dialogue-scout-radar-tip`

### npc-shadow-broker

- name: 暗巷掮客
- role: 事件触发 NPC
- defaultAppearanceTime: Hidden
- tags: `hidden`, `quest`, `danger`
- shortDescription: 默认隐藏，只能通过雷达或事件揭示。
- radarHint: 暗巷深处有不稳定的信号。
- defaultDialogueId: `dialogue-broker-first-contact`

## 约束

- NPC id 不应随显示名称变化。
- 删除 NPC 角色前必须检查所有 placement、dialogue 和 event 引用。
- 没有头像素材时使用语义占位图标，不阻塞功能实现。
