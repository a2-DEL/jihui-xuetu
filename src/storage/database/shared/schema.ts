import { sql } from "drizzle-orm";
import {
  pgTable, serial, varchar, timestamp, boolean, integer, jsonb, index,
  text, numeric, date, bigint, uniqueIndex
} from "drizzle-orm/pg-core";

// ==================== 系统健康检查表 ====================
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// ==================== 用户与权限系统 ====================

// 用户表
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    username: varchar("username", { length: 50 }).notNull().unique(),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    real_name: varchar("real_name", { length: 50 }).notNull(),
    email: varchar("email", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    avatar: varchar("avatar", { length: 500 }),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, locked
    last_login_at: timestamp("last_login_at", { withTimezone: true }),
    last_login_ip: varchar("last_login_ip", { length: 50 }),
    department_id: varchar("department_id", { length: 36 }),
    position: varchar("position", { length: 100 }), // 职位
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("users_username_idx").on(table.username),
    index("users_status_idx").on(table.status),
    index("users_department_id_idx").on(table.department_id),
  ]
);

// 部门表
export const departments = pgTable(
  "departments",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    parent_id: varchar("parent_id", { length: 36 }),
    level: integer("level").notNull().default(1),
    sort: integer("sort").notNull().default(0),
    leader_id: varchar("leader_id", { length: 36 }), // 部门负责人
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("departments_parent_id_idx").on(table.parent_id),
    index("departments_code_idx").on(table.code),
  ]
);

// 角色表
export const roles = pgTable(
  "roles",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 50 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(), // admin, manager, staff, student
    description: text("description"),
    is_system: boolean("is_system").notNull().default(false), // 系统内置角色不可删除
    status: varchar("status", { length: 20 }).notNull().default("active"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("roles_code_idx").on(table.code),
  ]
);

// 用户角色关联表
export const userRoles = pgTable(
  "user_roles",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    role_id: varchar("role_id", { length: 36 }).notNull().references(() => roles.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("user_roles_user_id_idx").on(table.user_id),
    index("user_roles_role_id_idx").on(table.role_id),
  ]
);

// 菜单表
export const menus = pgTable(
  "menus",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 50 }).notNull(),
    code: varchar("code", { length: 100 }).notNull(),
    parent_id: varchar("parent_id", { length: 36 }),
    path: varchar("path", { length: 200 }), // 前端路由路径
    icon: varchar("icon", { length: 100 }),
    component: varchar("component", { length: 200 }), // 组件路径
    sort: integer("sort").notNull().default(0),
    is_visible: boolean("is_visible").notNull().default(true),
    is_external: boolean("is_external").notNull().default(false), // 外链
    status: varchar("status", { length: 20 }).notNull().default("active"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("menus_parent_id_idx").on(table.parent_id),
    index("menus_code_idx").on(table.code),
  ]
);

// 角色菜单关联表
export const roleMenus = pgTable(
  "role_menus",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    role_id: varchar("role_id", { length: 36 }).notNull().references(() => roles.id, { onDelete: "cascade" }),
    menu_id: varchar("menu_id", { length: 36 }).notNull().references(() => menus.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("role_menus_role_id_idx").on(table.role_id),
    index("role_menus_menu_id_idx").on(table.menu_id),
  ]
);

// ==================== 申请管理系统 ====================

// 资助类型表
export const aidTypes = pgTable(
  "aid_types",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    description: text("description"),
    max_amount: numeric("max_amount", { precision: 12, scale: 2 }),
    min_amount: numeric("min_amount", { precision: 12, scale: 2 }),
    requires_review: boolean("requires_review").notNull().default(true),
    is_active: boolean("is_active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("aid_types_code_idx").on(table.code),
  ]
);

// 申请表
export const applications = pgTable(
  "applications",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    application_no: varchar("application_no", { length: 50 }).notNull().unique(), // 申请编号
    student_id: varchar("student_id", { length: 36 }).notNull(), // 学生ID
    student_name: varchar("student_name", { length: 50 }).notNull(),
    student_no: varchar("student_no", { length: 50 }).notNull(), // 学号
    college: varchar("college", { length: 100 }), // 学院
    major: varchar("major", { length: 100 }), // 专业
    grade: varchar("grade", { length: 20 }), // 年级
    class_name: varchar("class_name", { length: 50 }), // 班级
    
    aid_type_id: varchar("aid_type_id", { length: 36 }).notNull().references(() => aidTypes.id),
    apply_amount: numeric("apply_amount", { precision: 12, scale: 2 }), // 申请金额
    approved_amount: numeric("approved_amount", { precision: 12, scale: 2 }), // 批准金额
    
    title: varchar("title", { length: 200 }).notNull(), // 申请标题
    reason: text("reason").notNull(), // 申请理由
    family_info: jsonb("family_info"), // 家庭信息 JSON
    
    status: varchar("status", { length: 30 }).notNull().default("draft"), // draft, submitted, reviewing, approved, rejected, cancelled
    current_node_id: varchar("current_node_id", { length: 36 }), // 当前审批节点
    submit_at: timestamp("submit_at", { withTimezone: true }), // 提交时间
    
    ai_score: numeric("ai_score", { precision: 5, scale: 2 }), // AI评分 0-100
    ai_suggestion: text("ai_suggestion"), // AI建议
    ai_risk_level: varchar("ai_risk_level", { length: 20 }), // low, medium, high
    
    reviewed_by: varchar("reviewed_by", { length: 36 }), // 最终审核人
    reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
    review_comment: text("review_comment"), // 审核意见
    
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("applications_application_no_idx").on(table.application_no),
    index("applications_student_id_idx").on(table.student_id),
    index("applications_status_idx").on(table.status),
    index("applications_aid_type_id_idx").on(table.aid_type_id),
    index("applications_created_at_idx").on(table.created_at),
  ]
);

// 申请材料表
export const applicationMaterials = pgTable(
  "application_materials",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    application_id: varchar("application_id", { length: 36 }).notNull().references(() => applications.id, { onDelete: "cascade" }),
    material_type: varchar("material_type", { length: 50 }).notNull(), // id_card, transcript, poverty_cert, etc.
    material_name: varchar("material_name", { length: 100 }).notNull(),
    file_key: varchar("file_key", { length: 500 }).notNull(), // 对象存储key
    file_name: varchar("file_name", { length: 200 }).notNull(),
    file_size: bigint("file_size", { mode: "number" }),
    file_type: varchar("file_type", { length: 50 }),
    ocr_result: jsonb("ocr_result"), // OCR识别结果
    is_valid: boolean("is_valid").default(true), // 材料是否有效
    validation_message: text("validation_message"), // 校验信息
    uploaded_at: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("application_materials_application_id_idx").on(table.application_id),
  ]
);

// ==================== 审批工作流系统 ====================

// 工作流定义表
export const workflows = pgTable(
  "workflows",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    description: text("description"),
    version: integer("version").notNull().default(1),
    is_active: boolean("is_active").notNull().default(true),
    aid_type_id: varchar("aid_type_id", { length: 36 }), // 关联资助类型
    created_by: varchar("created_by", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("workflows_code_idx").on(table.code),
    index("workflows_aid_type_id_idx").on(table.aid_type_id),
  ]
);

// 工作流节点表
export const workflowNodes = pgTable(
  "workflow_nodes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    workflow_id: varchar("workflow_id", { length: 36 }).notNull().references(() => workflows.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    node_type: varchar("node_type", { length: 30 }).notNull(), // start, end, approval, condition, ai_review, notify
    sort: integer("sort").notNull().default(0),
    
    // 审批配置
    approver_type: varchar("approver_type", { length: 30 }), // user, role, department_leader, dynamic
    approver_ids: jsonb("approver_ids"), // 审批人ID列表
    role_id: varchar("role_id", { length: 36 }), // 角色审批
    
    // 条件配置
    condition_expr: jsonb("condition_expr"), // 条件表达式
    
    // AI配置
    ai_prompt: text("ai_prompt"), // AI提示词
    ai_threshold: numeric("ai_threshold", { precision: 5, scale: 2 }), // AI评分阈值
    
    // 通知配置
    notify_template: varchar("notify_template", { length: 100 }),
    notify_channels: jsonb("notify_channels"), // 通知渠道 ['email', 'sms', 'in_app']
    
    // 超时配置
    timeout_hours: integer("timeout_hours"), // 超时小时数
    timeout_action: varchar("timeout_action", { length: 30 }), // auto_approve, auto_reject, escalate
    
    next_node_id: varchar("next_node_id", { length: 36 }), // 下一个节点
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("workflow_nodes_workflow_id_idx").on(table.workflow_id),
  ]
);

// 审批记录表
export const approvalRecords = pgTable(
  "approval_records",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    application_id: varchar("application_id", { length: 36 }).notNull().references(() => applications.id, { onDelete: "cascade" }),
    workflow_id: varchar("workflow_id", { length: 36 }).notNull().references(() => workflows.id),
    node_id: varchar("node_id", { length: 36 }).notNull().references(() => workflowNodes.id),
    node_name: varchar("node_name", { length: 100 }).notNull(),
    
    approver_id: varchar("approver_id", { length: 36 }).notNull(),
    approver_name: varchar("approver_name", { length: 50 }).notNull(),
    
    action: varchar("action", { length: 30 }).notNull(), // approve, reject, return, transfer
    comment: text("comment"), // 审批意见
    
    ai_assisted: boolean("ai_assisted").default(false), // 是否AI辅助
    ai_suggestion: text("ai_suggestion"), // AI建议内容
    ai_confidence: numeric("ai_confidence", { precision: 5, scale: 2 }), // AI置信度
    
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("approval_records_application_id_idx").on(table.application_id),
    index("approval_records_approver_id_idx").on(table.approver_id),
    index("approval_records_created_at_idx").on(table.created_at),
  ]
);

// ==================== 知识库系统 ====================

// 知识库表
export const knowledgeBases = pgTable(
  "knowledge_bases",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    description: text("description"),
    type: varchar("type", { length: 30 }).notNull(), // policy, faq, document, mixed
    icon: varchar("icon", { length: 100 }),
    is_active: boolean("is_active").notNull().default(true),
    embedding_model: varchar("embedding_model", { length: 100 }).default("text-embedding-3-small"),
    chunk_size: integer("chunk_size").default(500),
    chunk_overlap: integer("chunk_overlap").default(50),
    created_by: varchar("created_by", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("knowledge_bases_code_idx").on(table.code),
  ]
);

// 知识文档表
export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    kb_id: varchar("kb_id", { length: 36 }).notNull().references(() => knowledgeBases.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    source_type: varchar("source_type", { length: 30 }).notNull(), // file, url, text
    source_url: varchar("source_url", { length: 500 }), // 来源URL
    file_key: varchar("file_key", { length: 500 }), // 文件key
    file_name: varchar("file_name", { length: 200 }),
    file_type: varchar("file_type", { length: 50 }),
    content: text("content"), // 文档内容
    summary: text("summary"), // 摘要
    
    vector_count: integer("vector_count").default(0), // 向量数量
    char_count: integer("char_count").default(0), // 字符数
    
    status: varchar("status", { length: 30 }).notNull().default("pending"), // pending, processing, completed, failed
    error_message: text("error_message"),
    
    metadata: jsonb("metadata"), // 元数据
    created_by: varchar("created_by", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("knowledge_documents_kb_id_idx").on(table.kb_id),
    index("knowledge_documents_status_idx").on(table.status),
  ]
);

// 知识片段表（向量存储引用）
export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    document_id: varchar("document_id", { length: 36 }).notNull().references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    kb_id: varchar("kb_id", { length: 36 }).notNull().references(() => knowledgeBases.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    chunk_index: integer("chunk_index").notNull(), // 片段索引
    start_char: integer("start_char"), // 起始字符位置
    end_char: integer("end_char"), // 结束字符位置
    vector_id: varchar("vector_id", { length: 100 }), // 向量数据库ID
    metadata: jsonb("metadata"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_chunks_document_id_idx").on(table.document_id),
    index("knowledge_chunks_kb_id_idx").on(table.kb_id),
  ]
);

// ==================== Agent编排系统 ====================

// Agent工作流表
export const agentWorkflows = pgTable(
  "agent_workflows",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    description: text("description"),
    category: varchar("category", { length: 50 }), // audit, analysis, notification, integration
    version: integer("version").notNull().default(1),
    is_active: boolean("is_active").notNull().default(true),
    
    // 工作流配置（JSON格式的节点和边）
    nodes: jsonb("nodes").notNull().default(sql`'[]'::jsonb`),
    edges: jsonb("edges").notNull().default(sql`'[]'::jsonb`),
    variables: jsonb("variables"), // 变量定义
    
    trigger_type: varchar("trigger_type", { length: 30 }).default("manual"), // manual, schedule, event, webhook
    trigger_config: jsonb("trigger_config"), // 触发配置
    
    created_by: varchar("created_by", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("agent_workflows_code_idx").on(table.code),
    index("agent_workflows_category_idx").on(table.category),
  ]
);

// Agent执行记录表
export const agentExecutions = pgTable(
  "agent_executions",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    workflow_id: varchar("workflow_id", { length: 36 }).notNull().references(() => agentWorkflows.id, { onDelete: "cascade" }),
    workflow_version: integer("workflow_version").notNull(),
    
    status: varchar("status", { length: 30 }).notNull().default("pending"), // pending, running, completed, failed, cancelled
    trigger_by: varchar("trigger_by", { length: 36 }), // 触发人
    trigger_type: varchar("trigger_type", { length: 30 }), // 触发类型
    
    input_data: jsonb("input_data"), // 输入数据
    output_data: jsonb("output_data"), // 输出数据
    error_message: text("error_message"),
    
    // 执行详情
    node_executions: jsonb("node_executions"), // 各节点执行状态
    total_nodes: integer("total_nodes").default(0),
    completed_nodes: integer("completed_nodes").default(0),
    
    started_at: timestamp("started_at", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    duration_ms: bigint("duration_ms", { mode: "number" }), // 执行耗时
    
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("agent_executions_workflow_id_idx").on(table.workflow_id),
    index("agent_executions_status_idx").on(table.status),
    index("agent_executions_created_at_idx").on(table.created_at),
  ]
);

// ==================== 通知消息系统 ====================

// 通知模板表
export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    type: varchar("type", { length: 30 }).notNull(), // email, sms, in_app, push
    subject: varchar("subject", { length: 200 }), // 邮件主题
    content: text("content").notNull(), // 模板内容，支持变量
    variables: jsonb("variables"), // 变量定义
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("notification_templates_code_idx").on(table.code),
  ]
);

// 消息表
export const messages = pgTable(
  "messages",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull(), // 接收人
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content").notNull(),
    type: varchar("type", { length: 30 }).notNull(), // system, approval, alert, announcement
    priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
    category: varchar("category", { length: 50 }), // 分类
    
    is_read: boolean("is_read").notNull().default(false),
    read_at: timestamp("read_at", { withTimezone: true }),
    
    link: varchar("link", { length: 500 }), // 跳转链接
    data: jsonb("data"), // 附加数据
    
    sender_id: varchar("sender_id", { length: 36 }), // 发送人（系统消息为空）
    sender_name: varchar("sender_name", { length: 50 }),
    
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_user_id_idx").on(table.user_id),
    index("messages_is_read_idx").on(table.is_read),
    index("messages_created_at_idx").on(table.created_at),
  ]
);

// 通知发送记录表
export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull(),
    template_id: varchar("template_id", { length: 36 }),
    channel: varchar("channel", { length: 30 }).notNull(), // email, sms, in_app
    recipient: varchar("recipient", { length: 200 }).notNull(), // 接收地址/号码
    subject: varchar("subject", { length: 200 }),
    content: text("content").notNull(),
    status: varchar("status", { length: 30 }).notNull(), // pending, sent, delivered, failed
    error_message: text("error_message"),
    external_id: varchar("external_id", { length: 100 }), // 外部服务ID
    sent_at: timestamp("sent_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notification_logs_user_id_idx").on(table.user_id),
    index("notification_logs_status_idx").on(table.status),
  ]
);

// ==================== AI对话系统 ====================

// AI会话表
export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull(),
    role_code: varchar("role_code", { length: 40 }).notNull(),
    title: varchar("title", { length: 200 }).notNull().default("新对话"),
    scene_tag: varchar("scene_tag", { length: 60 }).notNull().default("general"),
    context: jsonb("context"),
    summary: text("summary"),
    summary_through: integer("summary_through").notNull().default(0),
    message_count: integer("message_count").notNull().default(0),
    token_total: integer("token_total").notNull().default(0),
    version: integer("version").notNull().default(1),
    is_pinned: boolean("is_pinned").notNull().default(false),
    archived_at: timestamp("archived_at", { withTimezone: true }),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("ai_conversations_user_id_idx").on(table.user_id), index("ai_conversations_owner_role_idx").on(table.user_id, table.role_code, table.updated_at)]
);
export const aiMessages = pgTable(
  "ai_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    conversation_id: varchar("conversation_id", { length: 36 }).notNull().references(() => aiConversations.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    role: varchar("role", { length: 20 }).notNull(),
    content: text("content").notNull(),
    sources: jsonb("sources"),
    kb_ids: jsonb("kb_ids"),
    intent: varchar("intent", { length: 40 }),
    risk_level: varchar("risk_level", { length: 5 }),
    tool_name: varchar("tool_name", { length: 100 }),
    tool_arguments: jsonb("tool_arguments"),
    model: varchar("model", { length: 100 }),
    tokens_used: integer("tokens_used").notNull().default(0),
    latency_ms: integer("latency_ms"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("ai_messages_conversation_id_idx").on(table.conversation_id), uniqueIndex("ai_messages_order_unique").on(table.conversation_id, table.sequence)]
);

// ==================== 数据统计系统 ====================

// 统计快照表（用于大屏展示）
export const statisticsSnapshots = pgTable(
  "statistics_snapshots",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    snapshot_type: varchar("snapshot_type", { length: 50 }).notNull(), // daily, weekly, monthly
    snapshot_date: date("snapshot_date").notNull(),
    
    // 申请统计
    total_applications: integer("total_applications").default(0),
    pending_applications: integer("pending_applications").default(0),
    approved_applications: integer("approved_applications").default(0),
    rejected_applications: integer("rejected_applications").default(0),
    
    // 金额统计
    total_applied_amount: numeric("total_applied_amount", { precision: 14, scale: 2 }),
    total_approved_amount: numeric("total_approved_amount", { precision: 14, scale: 2 }),
    
    // 类型分布
    type_distribution: jsonb("type_distribution"), // 各类型申请数量
    college_distribution: jsonb("college_distribution"), // 各学院分布
    status_distribution: jsonb("status_distribution"), // 状态分布
    
    // AI统计
    ai_assisted_count: integer("ai_assisted_count").default(0), // AI辅助次数
    ai_accuracy_rate: numeric("ai_accuracy_rate", { precision: 5, scale: 2 }), // AI准确率
    
    // 趋势数据
    daily_trend: jsonb("daily_trend"), // 每日趋势
    monthly_trend: jsonb("monthly_trend"), // 每月趋势
    
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("statistics_snapshots_type_date_idx").on(table.snapshot_type, table.snapshot_date),
  ]
);

// ==================== 系统配置 ====================

// 系统配置表
export const systemConfigs = pgTable(
  "system_configs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    category: varchar("category", { length: 50 }).notNull(), // system, ai, notification, security
    key: varchar("key", { length: 100 }).notNull().unique(),
    value: text("value").notNull(),
    description: text("description"),
    is_secret: boolean("is_secret").notNull().default(false), // 是否加密存储
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("system_configs_category_idx").on(table.category),
    index("system_configs_key_idx").on(table.key),
  ]
);

// 操作日志表
export const operationLogs = pgTable(
  "operation_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }),
    user_name: varchar("user_name", { length: 50 }),
    module: varchar("module", { length: 50 }).notNull(), // 模块名
    action: varchar("action", { length: 50 }).notNull(), // 操作类型
    resource_type: varchar("resource_type", { length: 50 }), // 资源类型
    resource_id: varchar("resource_id", { length: 36 }), // 资源ID
    description: text("description"), // 操作描述
    request_data: jsonb("request_data"), // 请求数据
    response_code: integer("response_code"), // 响应码
    ip: varchar("ip", { length: 50 }),
    user_agent: varchar("user_agent", { length: 500 }),
    duration_ms: integer("duration_ms"), // 耗时
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("operation_logs_user_id_idx").on(table.user_id),
    index("operation_logs_module_idx").on(table.module),
    index("operation_logs_created_at_idx").on(table.created_at),
  ]
);

// ==================== 企业级资助主数据与安全审计 ====================

export const campuses = pgTable("campuses", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userCapabilities = pgTable("user_capabilities", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  capability_code: varchar("capability_code", { length: 50 }).notNull(),
  campus_id: varchar("campus_id", { length: 36 }),
  granted_by: varchar("granted_by", { length: 36 }).notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("user_capabilities_user_idx").on(table.user_id), index("user_capabilities_code_idx").on(table.capability_code)]);

export const studentProfiles = pgTable("student_profile", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  campus_id: varchar("campus_id", { length: 36 }).notNull(),
  student_no: varchar("student_no", { length: 50 }).notNull().unique(),
  department_id: varchar("department_id", { length: 36 }).notNull(),
  major_id: varchar("major_id", { length: 36 }),
  class_id: varchar("class_id", { length: 36 }).notNull(),
  enrollment_year: integer("enrollment_year"),
  education_level: varchar("education_level", { length: 30 }),
  identity_ciphertext: text("identity_ciphertext"),
  identity_hash: varchar("identity_hash", { length: 128 }),
  data_consent: jsonb("data_consent").default(sql`'{}'::jsonb`),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [index("student_profile_campus_idx").on(table.campus_id), index("student_profile_department_idx").on(table.department_id), index("student_profile_class_idx").on(table.class_id)]);

export const studentFamilyInfo = pgTable("student_family_info", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  student_id: varchar("student_id", { length: 36 }).notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  annual_income: numeric("annual_income", { precision: 14, scale: 2 }),
  member_count: integer("member_count"),
  labor_count: integer("labor_count"),
  hardship_type: varchar("hardship_type", { length: 50 }),
  medical_expense: numeric("medical_expense", { precision: 14, scale: 2 }),
  encrypted_detail: text("encrypted_detail"),
  source_version: integer("source_version").notNull().default(1),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [index("student_family_info_student_idx").on(table.student_id)]);

export const fundProjectRules = pgTable("fund_project_rule", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  aid_type_id: varchar("aid_type_id", { length: 36 }).references(() => aidTypes.id),
  campus_id: varchar("campus_id", { length: 36 }),
  academic_year: varchar("academic_year", { length: 20 }).notNull(),
  rule_version: integer("rule_version").notNull().default(1),
  effective_from: date("effective_from").notNull(),
  effective_to: date("effective_to"),
  eligibility_rule: jsonb("eligibility_rule").notNull(),
  amount_rule: jsonb("amount_rule").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  published_by: varchar("published_by", { length: 36 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("fund_project_rule_year_idx").on(table.academic_year), index("fund_project_rule_type_idx").on(table.aid_type_id)]);

export const fundQuotaAllocations = pgTable("fund_quota_allocation", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  project_rule_id: varchar("project_rule_id", { length: 36 }).notNull().references(() => fundProjectRules.id),
  campus_id: varchar("campus_id", { length: 36 }).notNull(),
  department_id: varchar("department_id", { length: 36 }),
  quota_count: integer("quota_count").notNull().default(0),
  budget_amount: numeric("budget_amount", { precision: 16, scale: 2 }).notNull(),
  occupied_amount: numeric("occupied_amount", { precision: 16, scale: 2 }).notNull().default("0"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("fund_quota_allocation_project_idx").on(table.project_rule_id), index("fund_quota_allocation_dept_idx").on(table.department_id)]);

export const fundDemocraticEvaluations = pgTable("fund_democratic_evaluation", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  application_id: varchar("application_id", { length: 36 }).notNull().references(() => applications.id),
  meeting_id: varchar("meeting_id", { length: 50 }).notNull(),
  result: varchar("result", { length: 30 }).notNull(),
  score_summary: jsonb("score_summary"),
  participant_hashes: jsonb("participant_hashes"),
  evidence_file_key: varchar("evidence_file_key", { length: 500 }),
  signed_at: timestamp("signed_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("fund_democratic_evaluation_application_idx").on(table.application_id)]);

export const fundBankAccounts = pgTable("fund_bank_account", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  student_id: varchar("student_id", { length: 36 }).notNull().references(() => studentProfiles.id),
  bank_code: varchar("bank_code", { length: 30 }).notNull(),
  account_ciphertext: text("account_ciphertext").notNull(),
  account_hash: varchar("account_hash", { length: 128 }).notNull(),
  verification_status: varchar("verification_status", { length: 30 }).notNull().default("pending"),
  verified_at: timestamp("verified_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("fund_bank_account_student_idx").on(table.student_id), index("fund_bank_account_hash_idx").on(table.account_hash)]);

export const fundGrantDetails = pgTable("fund_grant_detail", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  application_id: varchar("application_id", { length: 36 }).notNull().references(() => applications.id),
  bank_account_id: varchar("bank_account_id", { length: 36 }).notNull().references(() => fundBankAccounts.id),
  batch_no: varchar("batch_no", { length: 50 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("prepared"),
  bank_receipt_no: varchar("bank_receipt_no", { length: 100 }),
  failure_reason: text("failure_reason"),
  executed_by: varchar("executed_by", { length: 36 }),
  executed_at: timestamp("executed_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("fund_grant_detail_batch_idx").on(table.batch_no), index("fund_grant_detail_application_idx").on(table.application_id)]);

export const fundPublicityObjections = pgTable("fund_publicity_objection", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  application_id: varchar("application_id", { length: 36 }).notNull().references(() => applications.id),
  submitter_id: varchar("submitter_id", { length: 36 }).notNull(),
  content_ciphertext: text("content_ciphertext").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("submitted"),
  handler_id: varchar("handler_id", { length: 36 }),
  resolution: text("resolution"),
  resolved_at: timestamp("resolved_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("fund_publicity_objection_application_idx").on(table.application_id), index("fund_publicity_objection_status_idx").on(table.status)]);

export const aiDecisionSnapshots = pgTable("ai_decision_snapshot", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  task_id: varchar("task_id", { length: 64 }).notNull(),
  actor_id: varchar("actor_id", { length: 36 }).notNull(),
  actor_role: varchar("actor_role", { length: 50 }).notNull(),
  risk_level: varchar("risk_level", { length: 5 }).notNull(),
  input_summary: text("input_summary"),
  retrieval_sources: jsonb("retrieval_sources"),
  tool_trace: jsonb("tool_trace"),
  model_provider: varchar("model_provider", { length: 50 }),
  model_version: varchar("model_version", { length: 100 }),
  output_summary: text("output_summary"),
  decision_basis_summary: text("decision_basis_summary"),
  outcome: varchar("outcome", { length: 30 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("ai_decision_snapshot_task_idx").on(table.task_id), index("ai_decision_snapshot_actor_idx").on(table.actor_id), index("ai_decision_snapshot_created_idx").on(table.created_at)]);

export const aiToolRegistry = pgTable("ai_tool_registry", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  risk_level: varchar("risk_level", { length: 5 }).notNull(),
  permission_code: varchar("permission_code", { length: 100 }).notNull(),
  input_schema: jsonb("input_schema").notNull(),
  output_schema: jsonb("output_schema").notNull(),
  version: integer("version").notNull().default(1),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
  trust_score: numeric("trust_score", { precision: 5, scale: 2 }).notNull().default("0"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [index("ai_tool_registry_status_idx").on(table.status), index("ai_tool_registry_risk_idx").on(table.risk_level)]);

export const humanFeedbackRecords = pgTable("human_feedback_record", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  decision_snapshot_id: varchar("decision_snapshot_id", { length: 36 }).notNull().references(() => aiDecisionSnapshots.id),
  reviewer_id: varchar("reviewer_id", { length: 36 }).notNull(),
  feedback_type: varchar("feedback_type", { length: 30 }).notNull(),
  original_summary: text("original_summary"),
  corrected_summary: text("corrected_summary"),
  label: varchar("label", { length: 50 }),
  knowledge_sync_status: varchar("knowledge_sync_status", { length: 30 }).notNull().default("pending"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("human_feedback_snapshot_idx").on(table.decision_snapshot_id), index("human_feedback_sync_idx").on(table.knowledge_sync_status)]);

export const dataAccessLogs = pgTable("data_access_log", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  subject_user_id: varchar("subject_user_id", { length: 36 }),
  actor_user_id: varchar("actor_user_id", { length: 36 }).notNull(),
  actor_role: varchar("actor_role", { length: 50 }).notNull(),
  data_category: varchar("data_category", { length: 50 }).notNull(),
  sensitive_level: varchar("sensitive_level", { length: 5 }).notNull(),
  purpose: varchar("purpose", { length: 200 }).notNull(),
  field_mode: varchar("field_mode", { length: 20 }).notNull(),
  decision_code: varchar("decision_code", { length: 50 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("data_access_log_subject_idx").on(table.subject_user_id), index("data_access_log_actor_idx").on(table.actor_user_id), index("data_access_log_created_idx").on(table.created_at)]);

// ==================== 导出类型 ====================

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Menu = typeof menus.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type ApprovalRecord = typeof approvalRecords.$inferSelect;
export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type AgentWorkflow = typeof agentWorkflows.$inferSelect;
export type AgentExecution = typeof agentExecutions.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type AIConversation = typeof aiConversations.$inferSelect;
export type AIMessage = typeof aiMessages.$inferSelect;
export type StatisticsSnapshot = typeof statisticsSnapshots.$inferSelect;
export type SystemConfig = typeof systemConfigs.$inferSelect;
export type OperationLog = typeof operationLogs.$inferSelect;
export type Campus = typeof campuses.$inferSelect;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type StudentFamilyInfo = typeof studentFamilyInfo.$inferSelect;
export type FundProjectRule = typeof fundProjectRules.$inferSelect;
export type FundGrantDetail = typeof fundGrantDetails.$inferSelect;
export type AIDecisionSnapshot = typeof aiDecisionSnapshots.$inferSelect;
export type AIToolRegistryItem = typeof aiToolRegistry.$inferSelect;
export type HumanFeedbackRecord = typeof humanFeedbackRecords.$inferSelect;
export type DataAccessLog = typeof dataAccessLogs.$inferSelect;

