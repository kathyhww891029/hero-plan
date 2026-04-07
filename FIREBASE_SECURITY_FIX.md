# 🔐 Firebase 安全修复指南

## 问题
Firebase 数据库配置暴露在前端 `index.html` 中，任何人知道数据库 URL 即可读写数据，可能导致：
- 伪造大量 pending 记录让父母审核
- 直接修改 `approved`/`totalScore` 等节点篡改积分

## 修复方案

### 步骤 1：应用 Firebase Security Rules

1. 打开 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目 `hero-plan`
3. 左侧菜单 → **Realtime Database** → **规则**
4. 点击 **规则** 标签页
5. 删除现有规则，复制以下内容粘贴进去：

```json
{
  "rules": {
    "pending": {
      ".read": true,
      ".write": "!data.exists() && newData.hasChildren(['type', 'taskId', 'name', 'score', 'date', 'submittedAt'])",
      "$key": {
        ".write": "data.exists() && newData.hasChildren(['isSelf', 'status']) && data.child('status').val() !== 'approved'"
      }
    },
    "approved": {
      ".read": true,
      ".write": false
    },
    "totalScore": {
      ".read": true,
      ".write": false
    },
    "weeklyScore": {
      ".read": true,
      ".write": false
    },
    "characterRecords": {
      ".read": true,
      ".write": false
    },
    "ropeRecords": {
      ".read": true,
      ".write": false
    },
    "homeworkRecords": {
      ".read": true,
      ".write": false
    },
    "focusRecords": {
      ".read": true,
      ".write": false
    }
  }
}
```

6. 点击 **发布**

### 规则含义

| 节点 | 读 | 写 | 规则说明 |
|------|----|----|---------|
| `pending` | ✅ 公开 | ⚠️ 新增验证 | 新记录必须有 `type, taskId, name, score, date, submittedAt` |
| `pending/$key` | ✅ 公开 | ⚠️ 审核专用 | 只能更新 `isSelf, status`，且禁止修改已 `approved` 的记录 |
| `approved` | ✅ 公开 | ❌ 禁止 | 积分节点禁止客户端写入 |
| `totalScore` | ✅ 公开 | ❌ 禁止 | 累计积分禁止写入 |
| `weeklyScore` | ✅ 公开 | ❌ 禁止 | 周积分禁止写入 |
| `characterRecords` | ✅ 公开 | ❌ 禁止 | 品格记录禁止写入 |
| `ropeRecords` | ✅ 公开 | ❌ 禁止 | 跳绳记录禁止写入 |
| `homeworkRecords` | ✅ 公开 | ❌ 禁止 | 作业记录禁止写入 |
| `focusRecords` | ✅ 公开 | ❌ 禁止 | 专注记录禁止写入 |

### 攻击防御效果

| 攻击类型 | 防御效果 |
|---------|---------|
| 空数据刷屏 | ✅ 被规则拦截（需要必需字段） |
| 篡改积分 | ✅ `approved/totalScore` 禁止写入 |
| 修改已审核记录 | ✅ 禁止修改 `status=approved` 的记录 |
| 伪造审核通过 | ⚠️ 仍可更新 pending 记录，但 Cloud Function 可进一步加固 |

## 进一步加固（可选）

### Cloud Function 方案（推荐长期）

当前规则仍允许更新 pending 记录。真正的安全做法是将**积分变更逻辑移到 Cloud Function**：

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.approvePending = functions.database
  .ref('pending/{pushId}')
  .onUpdate(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();
    
    // 仅当 status 从 pending -> approved 时加分
    if (before.status === 'pending' && after.status === 'approved') {
      const db = admin.database();
      const scoreRef = db.ref('totalScore');
      const approvedRef = db.ref('approved');
      
      // 原子性加分
      return db.runTransaction(async (total) => {
        total = total || { value: 0 };
        total.value += after.score;
        await scoreRef.set(total);
        await approvedRef.push({ ...after, approvedAt: Date.now() });
        return total;
      });
    }
  });
```

这样即使用户修改了客户端代码，也无法直接改积分。

### Firebase Authentication 方案

如果希望限制 pending 读取（只有父母能看到），需要添加 Auth：

1. Firebase Console → **Authentication** → **开始** → 启用 **匿名**
2. 重构代码，每个设备登录获取 UID
3. pending 路径改为 `pending/{uid}/{recordId}`

⚠️ 注意：这会破坏父母审核功能，需要额外设计家庭共享机制。

## 验证修复

部署规则后，在浏览器控制台测试：

```javascript
// ✅ 应该成功（符合规则的新增）
firebase.database().ref('pending').push({
  type: 'daily',
  taskId: 'morning_mp1',
  name: '起床整理',
  score: 1,
  date: '2026-04-08',
  submittedAt: Date.now()
});

// ❌ 应该失败（违反规则）
firebase.database().ref('approved').set({ total: 9999 });

// ❌ 应该失败（违反规则）
firebase.database().ref('pending/-abc123').set({ status: 'approved', score: 9999 });
```

## 紧急回滚

如果规则导致功能异常：

1. Firebase Console → **Realtime Database** → **规则**
2. 改为：
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
3. 点击发布（临时止血，恢复后重新设计规则）

---

**📁 相关文件**：
- `firebase.rules.json` - 已生成的规则文件
- `FIREBASE_SECURITY_FIX.md` - 本指南
