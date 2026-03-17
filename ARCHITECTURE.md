# 企业级跨平台财务记账 Web 系统核心架构

## 模块一：数据库与事务
- 规范化表结构位于 `backend/src/db/schema.sql`。
- 信用卡分期事务 API：`POST /api/credit/installments`，同事务中并发更新额度 + 插入主交易 + 批量分期明细。

## 模块二：账单导入与规则引擎
- 前端 CSV 暂存：`frontend/src/components/StagingImportTable.tsx`（PapaParse + 虚拟列表 + 单条分类修正）。
- 默认规则种子：`backend/src/db/seed_rules.sql`。
- 后端自动分类：`backend/src/services/categoryRuleEngine.ts` + `POST /api/import/staging/confirm`。

## 模块三：核心财务引擎
- 分期算法：`backend/src/services/installmentService.ts`，使用 decimal.js，尾差并入最后一期。
- 净资产 SQL：`backend/src/db/net_asset.sql`。

## 模块四：响应式 UI 与图表
- 记账表单：`frontend/src/components/ResponsiveEntryForm.tsx`。
- 看板图表：`frontend/src/charts/MonthlyBarChart.tsx`、`frontend/src/charts/CategoryPieChart.tsx`。

## 模块五：安全与鉴权
- JWT 登录写入 HttpOnly + Secure Cookie：`backend/src/routes/auth.ts`。
- 路由守卫 + 懒加载：`frontend/src/router.tsx`。

## 模块六：PWA 与性能
- `frontend/public/manifest.json` + `frontend/public/service-worker.js` + `frontend/src/pwa/registerSW.ts`。
- 长列表窗口化渲染：`react-window` in `StagingImportTable.tsx`。

## 模块八：家庭协作与权限控制（扩展）
- 新增 `account_memberships`、`family_invitations`（见 `backend/src/db/schema_extensions.sql`）。
- 共享账本数据隔离与角色鉴权：`backend/src/middleware/accountScopeGuard.ts`。
- 共享流水与双人汇总看板 API：`backend/src/routes/family.ts`。

## 模块九：周期性自动账单（扩展）
- 新增 `recurring_rules`、`recurring_executions`（见 `backend/src/db/schema_extensions.sql`）。
- 定时任务调度：`backend/src/services/recurringScheduler.ts`（node-cron + DB 事务）。

## 模块十：多维标签与项目账本（扩展）
- 新增 `tags`、`transaction_tags`（见 `backend/src/db/schema_extensions.sql`）。
- 后端按 Tag 支出分析：`backend/src/routes/tags.ts`。
- 前端多选 Tag：`frontend/src/components/TagMultiSelect.tsx`。

## 模块十一：固定资产与专项管理（扩展）
- 新增 `assets`，并在 `transactions` 增加 `asset_id` 外键（见 `backend/src/db/schema_extensions.sql`）。
- 资产详情聚合 API：`backend/src/routes/assets.ts`。
- 前端资产详情页：`frontend/src/pages/AssetDetailPage.tsx`。
