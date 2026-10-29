-- VCoi SQL Server 2022 schema, captured from the application database on 2026-10-25.
-- Schema only. No logins, credentials, user data or machine-specific file paths.
-- SQLCMD mode: supply -v DatabaseName=YourNewDatabase. Run only on an empty user database.
USE [$(DatabaseName)];
GO
SET NOCOUNT ON; SET XACT_ABORT ON;
SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON; SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON; SET ARITHABORT ON; SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
IF DB_ID() <= 4 OR DB_NAME() <> N'$(DatabaseName)' THROW 54601, 'Select the intended empty user database.', 1;
BEGIN TRY
BEGIN TRANSACTION;
DECLARE @LockResult INT;
EXEC @LockResult=sys.sp_getapplock @Resource=N'VCoi:schema:2026-10-25', @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000;
IF @LockResult<0 THROW 54602, 'Could not lock schema initialization.', 1;
IF EXISTS(SELECT 1 FROM sys.tables WHERE is_ms_shipped=0) OR EXISTS(SELECT 1 FROM sys.views WHERE is_ms_shipped=0) THROW 54603, 'Database is not empty. Existing objects have not been replaced.', 1;

CREATE TABLE [dbo].[addresses] (
    [address_id] bigint IDENTITY(1,1) NOT NULL,
    [user_id] bigint NOT NULL,
    [contact_name] nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [contact_phone] varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [address_line] nvarchar(300) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [ward] nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [district] nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [province] nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [lat] decimal(9,6) NULL,
    [lng] decimal(9,6) NULL,
    [is_default] bit NOT NULL CONSTRAINT [DF__addresses__is_de__412EB0B6] DEFAULT ((0)),
    [created_at] datetime2(3) NOT NULL CONSTRAINT [DF__addresses__creat__4222D4EF] DEFAULT (sysutcdatetime())
);

CREATE TABLE [dbo].[collection_items] (
    [item_id] bigint IDENTITY(1,1) NOT NULL,
    [order_id] bigint NOT NULL,
    [material_id] int NOT NULL,
    [estimated_qty] decimal(12,3) NULL,
    [estimated_price_rule_id] bigint NULL,
    [estimated_unit_price] decimal(18,0) NULL,
    [photo_url] nvarchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [note] nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [estimated_line_total] AS (CONVERT([decimal](18,0),round([estimated_qty]*[estimated_unit_price],(0)))) PERSISTED
);

CREATE TABLE [dbo].[collection_orders] (
    [order_id] bigint IDENTITY(1,1) NOT NULL,
    [code] varchar(40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [seller_user_id] bigint NOT NULL,
    [collector_id] bigint NULL,
    [source_address_id] bigint NULL,
    [contact_name_snapshot] nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [contact_phone_snapshot] varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [address_snapshot] nvarchar(600) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [pickup_start] datetime2(3) NOT NULL,
    [pickup_end] datetime2(3) NOT NULL,
    [status] varchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL CONSTRAINT [DF__collectio__statu__628FA481] DEFAULT ('PENDING'),
    [seller_note] nvarchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [cancelled_at] datetime2(3) NULL,
    [cancellation_reason] nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [completed_at] datetime2(3) NULL,
    [version] int NOT NULL CONSTRAINT [DF__collectio__versi__6477ECF3] DEFAULT ((0)),
    [created_at] datetime2(3) NOT NULL CONSTRAINT [DF__collectio__creat__656C112C] DEFAULT (sysutcdatetime()),
    [updated_at] datetime2(3) NOT NULL CONSTRAINT [DF__collectio__updat__66603565] DEFAULT (sysutcdatetime()),
    [pickup_lat_snapshot] decimal(9,6) NULL,
    [pickup_lng_snapshot] decimal(9,6) NULL
);

CREATE TABLE [dbo].[disputes] (
    [dispute_id] bigint IDENTITY(1,1) NOT NULL,
    [order_id] bigint NOT NULL,
    [opened_by] bigint NOT NULL,
    [reason] nvarchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [evidence_url] nvarchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [previous_order_status] varchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [status] varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL CONSTRAINT [DF__disputes__status__29221CFB] DEFAULT ('OPEN'),
    [resolution] nvarchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [resolved_by] bigint NULL,
    [resolved_at] datetime2(3) NULL,
    [created_at] datetime2(3) NOT NULL CONSTRAINT [DF__disputes__create__2BFE89A6] DEFAULT (sysutcdatetime())
);

CREATE TABLE [dbo].[material_categories] (
    [category_id] int IDENTITY(1,1) NOT NULL,
    [name] nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [description] nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [is_active] bit NOT NULL CONSTRAINT [DF__material___is_ac__46E78A0C] DEFAULT ((1))
);

CREATE TABLE [dbo].[materials] (
    [material_id] int IDENTITY(1,1) NOT NULL,
    [category_id] int NOT NULL,
    [name] nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [grade] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL CONSTRAINT [DF__materials__grade__4BAC3F29] DEFAULT (N'Tiêu chuẩn'),
    [unit] varchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL CONSTRAINT [DF__materials__unit__4CA06362] DEFAULT ('KG'),
    [description] nvarchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [excluded_items] nvarchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [image_url] nvarchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [accepted] bit NOT NULL CONSTRAINT [DF__materials__accep__4E88ABD4] DEFAULT ((1))
);

CREATE TABLE [dbo].[order_change_requests] (
    [request_id] bigint IDENTITY(1,1) NOT NULL,
    [order_id] bigint NOT NULL,
    [requested_by] bigint NOT NULL,
    [request_type] varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [reason] nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [old_pickup_start] datetime2(3) NOT NULL,
    [old_pickup_end] datetime2(3) NOT NULL,
    [new_pickup_start] datetime2(3) NULL,
    [new_pickup_end] datetime2(3) NULL,
    [status] varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL CONSTRAINT [DF__order_cha__statu__3A4CA8FD] DEFAULT ('PENDING'),
    [processed_by] bigint NULL,
    [processed_at] datetime2(3) NULL,
    [response_note] nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [version] int NOT NULL CONSTRAINT [DF__order_cha__versi__3D2915A8] DEFAULT ((0)),
    [created_at] datetime2(3) NOT NULL CONSTRAINT [DF__order_cha__creat__3E1D39E1] DEFAULT (sysutcdatetime())
);

CREATE TABLE [dbo].[order_quotes] (
    [quote_id] bigint IDENTITY(1,1) NOT NULL,
    [order_id] bigint NOT NULL,
    [version_number] int NOT NULL,
    [status] varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL CONSTRAINT [DF__order_quo__statu__02084FDA] DEFAULT ('DRAFT'),
    [is_current] bit NOT NULL CONSTRAINT [DF__order_quo__is_cu__03F0984C] DEFAULT ((1)),
    [total_amount] decimal(18,0) NOT NULL CONSTRAINT [DF__order_quo__total__04E4BC85] DEFAULT ((0)),
    [valid_until] datetime2(3) NULL,
    [created_by] bigint NOT NULL,
    [created_at] datetime2(3) NOT NULL CONSTRAINT [DF__order_quo__creat__07C12930] DEFAULT (sysutcdatetime()),
    [sent_at] datetime2(3) NULL,
    [responded_by] bigint NULL,
    [responded_at] datetime2(3) NULL,
    [response_note] nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [version] int NOT NULL CONSTRAINT [DF__order_quo__versi__08B54D69] DEFAULT ((0))
);

CREATE TABLE [dbo].[order_status_logs] (
    [log_id] bigint IDENTITY(1,1) NOT NULL,
    [order_id] bigint NOT NULL,
    [old_status] varchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [new_status] varchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [changed_by] bigint NOT NULL,
    [old_collector_id] bigint NULL,
    [new_collector_id] bigint NULL,
    [reason] nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [changed_at] datetime2(3) NOT NULL CONSTRAINT [DF__order_sta__chang__3587F3E0] DEFAULT (sysutcdatetime())
);

CREATE TABLE [dbo].[payments] (
    [payment_id] bigint IDENTITY(1,1) NOT NULL,
    [order_id] bigint NOT NULL,
    [quote_id] bigint NOT NULL,
    [amount] decimal(18,0) NOT NULL,
    [method] varchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [status] varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL CONSTRAINT [DF__payments__status__1EA48E88] DEFAULT ('PENDING'),
    [request_key] uniqueidentifier NOT NULL,
    [paid_at] datetime2(3) NULL,
    [evidence_url] nvarchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [reference_code] varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [recorded_by] bigint NOT NULL,
    [created_at] datetime2(3) NOT NULL CONSTRAINT [DF__payments__create__2180FB33] DEFAULT (sysutcdatetime())
);

CREATE TABLE [dbo].[price_rules] (
    [price_rule_id] bigint IDENTITY(1,1) NOT NULL,
    [material_id] int NOT NULL,
    [unit_price] decimal(18,0) NOT NULL,
    [valid_from] datetime2(3) NOT NULL,
    [valid_to] datetime2(3) NULL,
    [approval_status] varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL CONSTRAINT [DF__price_rul__appro__5535A963] DEFAULT ('DRAFT'),
    [version_number] int NOT NULL,
    [created_by] bigint NOT NULL,
    [approved_by] bigint NULL,
    [approved_at] datetime2(3) NULL,
    [created_at] datetime2(3) NOT NULL CONSTRAINT [DF__price_rul__creat__59FA5E80] DEFAULT (sysutcdatetime())
);

CREATE TABLE [dbo].[quote_items] (
    [quote_item_id] bigint IDENTITY(1,1) NOT NULL,
    [quote_id] bigint NOT NULL,
    [order_id] bigint NOT NULL,
    [item_id] bigint NOT NULL,
    [weighing_id] bigint NOT NULL,
    [material_id] int NOT NULL,
    [price_rule_id] bigint NOT NULL,
    [material_name_snapshot] nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [grade_snapshot] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [unit_snapshot] varchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL CONSTRAINT [DF__quote_ite__unit___123EB7A3] DEFAULT ('KG'),
    [actual_qty] decimal(12,3) NOT NULL,
    [unit_price_snapshot] decimal(18,0) NOT NULL,
    [line_total] AS (CONVERT([decimal](18,0),round([actual_qty]*[unit_price_snapshot],(0)))) PERSISTED,
    [adjustment_reason] nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL
);

CREATE TABLE [dbo].[users] (
    [user_id] bigint IDENTITY(1,1) NOT NULL,
    [full_name] nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [phone] varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [email] nvarchar(254) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [password_hash] varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [role] varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [status] varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL CONSTRAINT [DF__users__status__398D8EEE] DEFAULT ('ACTIVE'),
    [created_at] datetime2(3) NOT NULL CONSTRAINT [DF__users__created_a__3B75D760] DEFAULT (sysutcdatetime()),
    [updated_at] datetime2(3) NOT NULL CONSTRAINT [DF__users__updated_a__3C69FB99] DEFAULT (sysutcdatetime())
);

CREATE TABLE [dbo].[weighing_records] (
    [weighing_id] bigint IDENTITY(1,1) NOT NULL,
    [item_id] bigint NOT NULL,
    [gross_weight] decimal(12,3) NOT NULL,
    [tare_weight] decimal(12,3) NOT NULL CONSTRAINT [DF__weighing___tare___75A278F5] DEFAULT ((0)),
    [net_weight] AS (CONVERT([decimal](12,3),[gross_weight]-[tare_weight])) PERSISTED,
    [photo_url] nvarchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [created_by] bigint NOT NULL,
    [created_at] datetime2(3) NOT NULL CONSTRAINT [DF__weighing___creat__778AC167] DEFAULT (sysutcdatetime()),
    [correction_of] bigint NULL,
    [correction_reason] nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL
);

ALTER TABLE [dbo].[addresses] ADD CONSTRAINT [PK__addresse__CAA247C835AC02A9] PRIMARY KEY CLUSTERED ([address_id] ASC);
ALTER TABLE [dbo].[addresses] ADD CONSTRAINT [UQ_address_owner] UNIQUE NONCLUSTERED ([address_id] ASC, [user_id] ASC);
CREATE UNIQUE NONCLUSTERED INDEX [UX_addresses_default] ON [dbo].[addresses] ([user_id] ASC) WHERE ([is_default]=(1));
CREATE NONCLUSTERED INDEX [IX_items_material] ON [dbo].[collection_items] ([material_id] ASC);
ALTER TABLE [dbo].[collection_items] ADD CONSTRAINT [PK__collecti__52020FDDEE180A9A] PRIMARY KEY CLUSTERED ([item_id] ASC);
ALTER TABLE [dbo].[collection_items] ADD CONSTRAINT [UQ_item_order] UNIQUE NONCLUSTERED ([item_id] ASC, [order_id] ASC);
ALTER TABLE [dbo].[collection_items] ADD CONSTRAINT [UQ_order_material] UNIQUE NONCLUSTERED ([order_id] ASC, [material_id] ASC);
CREATE NONCLUSTERED INDEX [IX_orders_collector] ON [dbo].[collection_orders] ([collector_id] ASC, [status] ASC, [pickup_start] ASC);
CREATE NONCLUSTERED INDEX [IX_orders_dispatch] ON [dbo].[collection_orders] ([status] ASC, [pickup_start] ASC);
CREATE NONCLUSTERED INDEX [IX_orders_seller] ON [dbo].[collection_orders] ([seller_user_id] ASC, [created_at] DESC);
ALTER TABLE [dbo].[collection_orders] ADD CONSTRAINT [PK__collecti__4659622970319C27] PRIMARY KEY CLUSTERED ([order_id] ASC);
ALTER TABLE [dbo].[collection_orders] ADD CONSTRAINT [UQ__collecti__357D4CF9A35330A6] UNIQUE NONCLUSTERED ([code] ASC);
ALTER TABLE [dbo].[collection_orders] ADD CONSTRAINT [UQ_order_seller] UNIQUE NONCLUSTERED ([order_id] ASC, [seller_user_id] ASC);
CREATE NONCLUSTERED INDEX [IX_disputes_order] ON [dbo].[disputes] ([order_id] ASC, [status] ASC);
ALTER TABLE [dbo].[disputes] ADD CONSTRAINT [PK__disputes__F52EEC272794C7B1] PRIMARY KEY CLUSTERED ([dispute_id] ASC);
ALTER TABLE [dbo].[material_categories] ADD CONSTRAINT [PK__material__D54EE9B4DBF7634B] PRIMARY KEY CLUSTERED ([category_id] ASC);
ALTER TABLE [dbo].[material_categories] ADD CONSTRAINT [UQ__material__72E12F1B2A6ED4FA] UNIQUE NONCLUSTERED ([name] ASC);
ALTER TABLE [dbo].[materials] ADD CONSTRAINT [PK__material__6BFE1D287953CA11] PRIMARY KEY CLUSTERED ([material_id] ASC);
ALTER TABLE [dbo].[materials] ADD CONSTRAINT [UQ_material_variant] UNIQUE NONCLUSTERED ([category_id] ASC, [name] ASC, [grade] ASC);
CREATE NONCLUSTERED INDEX [IX_changes_order] ON [dbo].[order_change_requests] ([order_id] ASC, [created_at] DESC);
ALTER TABLE [dbo].[order_change_requests] ADD CONSTRAINT [PK__order_ch__18D3B90F30CDD919] PRIMARY KEY CLUSTERED ([request_id] ASC);
CREATE UNIQUE NONCLUSTERED INDEX [UX_change_pending] ON [dbo].[order_change_requests] ([order_id] ASC) WHERE ([status]='PENDING');
ALTER TABLE [dbo].[order_quotes] ADD CONSTRAINT [PK__order_qu__0D37DF0CDB4FEEE9] PRIMARY KEY CLUSTERED ([quote_id] ASC);
ALTER TABLE [dbo].[order_quotes] ADD CONSTRAINT [UQ_quote_order] UNIQUE NONCLUSTERED ([quote_id] ASC, [order_id] ASC);
ALTER TABLE [dbo].[order_quotes] ADD CONSTRAINT [UQ_quote_payment] UNIQUE NONCLUSTERED ([quote_id] ASC, [order_id] ASC, [total_amount] ASC);
ALTER TABLE [dbo].[order_quotes] ADD CONSTRAINT [UQ_quote_version] UNIQUE NONCLUSTERED ([order_id] ASC, [version_number] ASC);
CREATE UNIQUE NONCLUSTERED INDEX [UX_quote_accepted] ON [dbo].[order_quotes] ([order_id] ASC) WHERE ([status]='ACCEPTED');
CREATE UNIQUE NONCLUSTERED INDEX [UX_quote_current] ON [dbo].[order_quotes] ([order_id] ASC) WHERE ([is_current]=(1));
CREATE NONCLUSTERED INDEX [IX_logs_order] ON [dbo].[order_status_logs] ([order_id] ASC, [changed_at] ASC, [log_id] ASC);
ALTER TABLE [dbo].[order_status_logs] ADD CONSTRAINT [PK__order_st__9E2397E0C83D2916] PRIMARY KEY CLUSTERED ([log_id] ASC);
CREATE NONCLUSTERED INDEX [IX_payment_order] ON [dbo].[payments] ([order_id] ASC, [created_at] DESC);
ALTER TABLE [dbo].[payments] ADD CONSTRAINT [PK__payments__ED1FC9EAA3051D18] PRIMARY KEY CLUSTERED ([payment_id] ASC);
ALTER TABLE [dbo].[payments] ADD CONSTRAINT [UQ__payments__A423FD21C1E0356B] UNIQUE NONCLUSTERED ([request_key] ASC);
CREATE UNIQUE NONCLUSTERED INDEX [UX_payment_completed] ON [dbo].[payments] ([order_id] ASC) WHERE ([status]='COMPLETED');
CREATE UNIQUE NONCLUSTERED INDEX [UX_payment_reference] ON [dbo].[payments] ([reference_code] ASC) WHERE ([reference_code] IS NOT NULL);
CREATE NONCLUSTERED INDEX [IX_prices_lookup] ON [dbo].[price_rules] ([material_id] ASC, [approval_status] ASC, [valid_from] ASC);
ALTER TABLE [dbo].[price_rules] ADD CONSTRAINT [PK__price_ru__918E21A7ED2F7E3A] PRIMARY KEY CLUSTERED ([price_rule_id] ASC);
ALTER TABLE [dbo].[price_rules] ADD CONSTRAINT [UQ_price_snapshot] UNIQUE NONCLUSTERED ([price_rule_id] ASC, [material_id] ASC, [unit_price] ASC);
ALTER TABLE [dbo].[price_rules] ADD CONSTRAINT [UQ_price_version] UNIQUE NONCLUSTERED ([material_id] ASC, [version_number] ASC);
ALTER TABLE [dbo].[quote_items] ADD CONSTRAINT [PK__quote_it__265BEED4744BE880] PRIMARY KEY CLUSTERED ([quote_item_id] ASC);
ALTER TABLE [dbo].[quote_items] ADD CONSTRAINT [UQ_quote_item] UNIQUE NONCLUSTERED ([quote_id] ASC, [item_id] ASC);
ALTER TABLE [dbo].[users] ADD CONSTRAINT [PK__users__B9BE370F0D4FC9FD] PRIMARY KEY CLUSTERED ([user_id] ASC);
ALTER TABLE [dbo].[users] ADD CONSTRAINT [UQ__users__B43B145F29D4C311] UNIQUE NONCLUSTERED ([phone] ASC);
CREATE UNIQUE NONCLUSTERED INDEX [UX_users_email] ON [dbo].[users] ([email] ASC) WHERE ([email] IS NOT NULL);
CREATE NONCLUSTERED INDEX [IX_weighing_item] ON [dbo].[weighing_records] ([item_id] ASC, [created_at] ASC, [weighing_id] ASC);
ALTER TABLE [dbo].[weighing_records] ADD CONSTRAINT [PK__weighing__8ACE5E8ECCC8A6FE] PRIMARY KEY CLUSTERED ([weighing_id] ASC);
ALTER TABLE [dbo].[weighing_records] ADD CONSTRAINT [UQ_weighing_item] UNIQUE NONCLUSTERED ([weighing_id] ASC, [item_id] ASC);
CREATE UNIQUE NONCLUSTERED INDEX [UX_weighing_correction] ON [dbo].[weighing_records] ([correction_of] ASC) WHERE ([correction_of] IS NOT NULL);

ALTER TABLE [dbo].[addresses] WITH CHECK ADD CONSTRAINT [CK_address_coordinates] CHECK ([lat] IS NULL AND [lng] IS NULL OR [lat] IS NOT NULL AND [lng] IS NOT NULL AND ([lat]>=(-90) AND [lat]<=(90)) AND ([lng]>=(-180) AND [lng]<=(180)));
ALTER TABLE [dbo].[collection_items] WITH CHECK ADD CONSTRAINT [CK__collectio__estim__6EF57B66] CHECK ([estimated_qty] IS NULL OR [estimated_qty]>(0));
ALTER TABLE [dbo].[collection_items] WITH CHECK ADD CONSTRAINT [CK_estimated_price] CHECK ([estimated_price_rule_id] IS NULL AND [estimated_unit_price] IS NULL OR [estimated_price_rule_id] IS NOT NULL AND [estimated_unit_price] IS NOT NULL AND [estimated_unit_price]>(0));
ALTER TABLE [dbo].[collection_orders] WITH CHECK ADD CONSTRAINT [CK__collectio__statu__6383C8BA] CHECK ([status]='DISPUTED' OR [status]='CANCELLED' OR [status]='COMPLETED' OR [status]='AWAITING_PAYMENT' OR [status]='AWAITING_SELLER_APPROVAL' OR [status]='ARRIVED' OR [status]='EN_ROUTE' OR [status]='ASSIGNED' OR [status]='CONFIRMED' OR [status]='PENDING');
ALTER TABLE [dbo].[collection_orders] WITH CHECK ADD CONSTRAINT [CK_order_slot] CHECK ([pickup_end]>[pickup_start]);
ALTER TABLE [dbo].[disputes] WITH CHECK ADD CONSTRAINT [CK__disputes__previo__282DF8C2] CHECK ([previous_order_status]='CANCELLED' OR [previous_order_status]='COMPLETED' OR [previous_order_status]='AWAITING_PAYMENT' OR [previous_order_status]='AWAITING_SELLER_APPROVAL' OR [previous_order_status]='ARRIVED' OR [previous_order_status]='EN_ROUTE' OR [previous_order_status]='ASSIGNED' OR [previous_order_status]='CONFIRMED' OR [previous_order_status]='PENDING');
ALTER TABLE [dbo].[disputes] WITH CHECK ADD CONSTRAINT [CK__disputes__status__2A164134] CHECK ([status]='REJECTED' OR [status]='RESOLVED' OR [status]='IN_REVIEW' OR [status]='OPEN');
ALTER TABLE [dbo].[disputes] WITH CHECK ADD CONSTRAINT [CK_dispute_resolution] CHECK (([status]='IN_REVIEW' OR [status]='OPEN') AND [resolved_by] IS NULL AND [resolved_at] IS NULL OR ([status]='REJECTED' OR [status]='RESOLVED') AND [resolved_by] IS NOT NULL AND [resolved_at] IS NOT NULL AND [resolved_at]>=[created_at] AND [resolution] IS NOT NULL);
ALTER TABLE [dbo].[materials] WITH CHECK ADD CONSTRAINT [CK__materials__unit__4D94879B] CHECK ([unit]='KG');
ALTER TABLE [dbo].[order_change_requests] WITH CHECK ADD CONSTRAINT [CK__order_cha__reaso__395884C4] CHECK (len(ltrim(rtrim([reason])))>(0));
ALTER TABLE [dbo].[order_change_requests] WITH CHECK ADD CONSTRAINT [CK__order_cha__reque__3864608B] CHECK ([request_type]='RESCHEDULE' OR [request_type]='CANCEL');
ALTER TABLE [dbo].[order_change_requests] WITH CHECK ADD CONSTRAINT [CK__order_cha__statu__3B40CD36] CHECK ([status]='WITHDRAWN' OR [status]='REJECTED' OR [status]='APPROVED' OR [status]='PENDING');
ALTER TABLE [dbo].[order_change_requests] WITH CHECK ADD CONSTRAINT [CK_change_new_slot] CHECK ([request_type]='CANCEL' AND [new_pickup_start] IS NULL AND [new_pickup_end] IS NULL OR [request_type]='RESCHEDULE' AND [new_pickup_start] IS NOT NULL AND [new_pickup_end] IS NOT NULL AND [new_pickup_end]>[new_pickup_start]);
ALTER TABLE [dbo].[order_change_requests] WITH CHECK ADD CONSTRAINT [CK_change_old_slot] CHECK ([old_pickup_end]>[old_pickup_start]);
ALTER TABLE [dbo].[order_change_requests] WITH CHECK ADD CONSTRAINT [CK_change_processing] CHECK ([status]='PENDING' AND [processed_by] IS NULL AND [processed_at] IS NULL OR ([status]='WITHDRAWN' OR [status]='REJECTED' OR [status]='APPROVED') AND [processed_by] IS NOT NULL AND [processed_at] IS NOT NULL AND [processed_at]>=[created_at]);
ALTER TABLE [dbo].[order_quotes] WITH CHECK ADD CONSTRAINT [CK__order_quo__statu__02FC7413] CHECK ([status]='SUPERSEDED' OR [status]='REJECTED' OR [status]='ACCEPTED' OR [status]='SENT' OR [status]='DRAFT');
ALTER TABLE [dbo].[order_quotes] WITH CHECK ADD CONSTRAINT [CK__order_quo__total__05D8E0BE] CHECK ([total_amount]>=(0));
ALTER TABLE [dbo].[order_quotes] WITH CHECK ADD CONSTRAINT [CK__order_quo__versi__01142BA1] CHECK ([version_number]>(0));
ALTER TABLE [dbo].[order_quotes] WITH CHECK ADD CONSTRAINT [CK_quote_accepted_current] CHECK ([status]<>'ACCEPTED' OR [is_current]=(1));
ALTER TABLE [dbo].[order_quotes] WITH CHECK ADD CONSTRAINT [CK_quote_positive] CHECK ([status]='SUPERSEDED' OR [status]='DRAFT' OR [total_amount]>(0));
ALTER TABLE [dbo].[order_quotes] WITH CHECK ADD CONSTRAINT [CK_quote_response] CHECK (([status]='REJECTED' OR [status]='ACCEPTED') AND [responded_by] IS NOT NULL AND [responded_at] IS NOT NULL OR ([status]='SUPERSEDED' OR [status]='SENT' OR [status]='DRAFT') AND [responded_by] IS NULL AND [responded_at] IS NULL);
ALTER TABLE [dbo].[order_quotes] WITH CHECK ADD CONSTRAINT [CK_quote_sent] CHECK ([status]='SUPERSEDED' OR [status]='DRAFT' OR [sent_at] IS NOT NULL);
ALTER TABLE [dbo].[order_quotes] WITH CHECK ADD CONSTRAINT [CK_quote_time] CHECK (([valid_until] IS NULL OR [valid_until]>[created_at]) AND ([sent_at] IS NULL OR [sent_at]>=[created_at]) AND ([responded_at] IS NULL OR [sent_at] IS NOT NULL AND [responded_at]>=[sent_at]));
ALTER TABLE [dbo].[order_status_logs] WITH CHECK ADD CONSTRAINT [CK__order_sta__new_s__31B762FC] CHECK ([new_status]='DISPUTED' OR [new_status]='CANCELLED' OR [new_status]='COMPLETED' OR [new_status]='AWAITING_PAYMENT' OR [new_status]='AWAITING_SELLER_APPROVAL' OR [new_status]='ARRIVED' OR [new_status]='EN_ROUTE' OR [new_status]='ASSIGNED' OR [new_status]='CONFIRMED' OR [new_status]='PENDING');
ALTER TABLE [dbo].[order_status_logs] WITH CHECK ADD CONSTRAINT [CK__order_sta__old_s__30C33EC3] CHECK ([old_status] IS NULL OR ([old_status]='DISPUTED' OR [old_status]='CANCELLED' OR [old_status]='COMPLETED' OR [old_status]='AWAITING_PAYMENT' OR [old_status]='AWAITING_SELLER_APPROVAL' OR [old_status]='ARRIVED' OR [old_status]='EN_ROUTE' OR [old_status]='ASSIGNED' OR [old_status]='CONFIRMED' OR [old_status]='PENDING'));
ALTER TABLE [dbo].[payments] WITH CHECK ADD CONSTRAINT [CK__payments__amount__1CBC4616] CHECK ([amount]>(0));
ALTER TABLE [dbo].[payments] WITH CHECK ADD CONSTRAINT [CK__payments__method__1DB06A4F] CHECK ([method]='TRANSFER_SIMULATED' OR [method]='CASH_SIMULATED');
ALTER TABLE [dbo].[payments] WITH CHECK ADD CONSTRAINT [CK__payments__status__1F98B2C1] CHECK ([status]='FAILED' OR [status]='COMPLETED' OR [status]='PENDING');
ALTER TABLE [dbo].[payments] WITH CHECK ADD CONSTRAINT [CK_payment_time] CHECK ([status]='COMPLETED' AND [paid_at] IS NOT NULL AND [paid_at]>=[created_at] OR ([status]='FAILED' OR [status]='PENDING') AND [paid_at] IS NULL);
ALTER TABLE [dbo].[price_rules] WITH CHECK ADD CONSTRAINT [CK__price_rul__appro__5629CD9C] CHECK ([approval_status]='REJECTED' OR [approval_status]='APPROVED' OR [approval_status]='DRAFT');
ALTER TABLE [dbo].[price_rules] WITH CHECK ADD CONSTRAINT [CK__price_rul__unit___5441852A] CHECK ([unit_price]>(0));
ALTER TABLE [dbo].[price_rules] WITH CHECK ADD CONSTRAINT [CK__price_rul__versi__571DF1D5] CHECK ([version_number]>(0));
ALTER TABLE [dbo].[price_rules] WITH CHECK ADD CONSTRAINT [CK_price_approval] CHECK ([approval_status]='APPROVED' AND [approved_by] IS NOT NULL AND [approved_at] IS NOT NULL OR ([approval_status]='REJECTED' OR [approval_status]='DRAFT') AND [approved_by] IS NULL AND [approved_at] IS NULL);
ALTER TABLE [dbo].[price_rules] WITH CHECK ADD CONSTRAINT [CK_price_period] CHECK ([valid_to] IS NULL OR [valid_to]>[valid_from]);
ALTER TABLE [dbo].[quote_items] WITH CHECK ADD CONSTRAINT [CK__quote_ite__actua__14270015] CHECK ([actual_qty]>(0));
ALTER TABLE [dbo].[quote_items] WITH CHECK ADD CONSTRAINT [CK__quote_ite__unit___1332DBDC] CHECK ([unit_snapshot]='KG');
ALTER TABLE [dbo].[quote_items] WITH CHECK ADD CONSTRAINT [CK__quote_ite__unit___151B244E] CHECK ([unit_price_snapshot]>(0));
ALTER TABLE [dbo].[users] WITH CHECK ADD CONSTRAINT [CK__users__role__38996AB5] CHECK ([role]='ADMIN' OR [role]='COLLECTOR' OR [role]='CUSTOMER');
ALTER TABLE [dbo].[users] WITH CHECK ADD CONSTRAINT [CK__users__status__3A81B327] CHECK ([status]='LOCKED' OR [status]='ACTIVE');
ALTER TABLE [dbo].[weighing_records] WITH CHECK ADD CONSTRAINT [CK_weighing_correction] CHECK ([correction_of] IS NULL AND [correction_reason] IS NULL OR [correction_of] IS NOT NULL AND [correction_of]<[weighing_id] AND [correction_reason] IS NOT NULL AND len(ltrim(rtrim([correction_reason])))>(0));
ALTER TABLE [dbo].[weighing_records] WITH CHECK ADD CONSTRAINT [CK_weighing_weights] CHECK ([gross_weight]>=[tare_weight] AND [tare_weight]>=(0));

ALTER TABLE [dbo].[addresses] WITH CHECK ADD CONSTRAINT [FK__addresses__user___403A8C7D] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[collection_items] WITH CHECK ADD CONSTRAINT [FK__collectio__mater__6E01572D] FOREIGN KEY ([material_id]) REFERENCES [dbo].[materials] ([material_id]);
ALTER TABLE [dbo].[collection_items] WITH CHECK ADD CONSTRAINT [FK__collectio__order__6D0D32F4] FOREIGN KEY ([order_id]) REFERENCES [dbo].[collection_orders] ([order_id]);
ALTER TABLE [dbo].[collection_items] WITH CHECK ADD CONSTRAINT [FK_item_estimated_price] FOREIGN KEY ([estimated_price_rule_id], [material_id], [estimated_unit_price]) REFERENCES [dbo].[price_rules] ([price_rule_id], [material_id], [unit_price]);
ALTER TABLE [dbo].[collection_orders] WITH CHECK ADD CONSTRAINT [FK__collectio__colle__619B8048] FOREIGN KEY ([collector_id]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[collection_orders] WITH CHECK ADD CONSTRAINT [FK__collectio__selle__60A75C0F] FOREIGN KEY ([seller_user_id]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[collection_orders] WITH CHECK ADD CONSTRAINT [FK_order_source_address] FOREIGN KEY ([source_address_id], [seller_user_id]) REFERENCES [dbo].[addresses] ([address_id], [user_id]);
ALTER TABLE [dbo].[disputes] WITH CHECK ADD CONSTRAINT [FK__disputes__opened__2739D489] FOREIGN KEY ([opened_by]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[disputes] WITH CHECK ADD CONSTRAINT [FK__disputes__order___2645B050] FOREIGN KEY ([order_id]) REFERENCES [dbo].[collection_orders] ([order_id]);
ALTER TABLE [dbo].[disputes] WITH CHECK ADD CONSTRAINT [FK__disputes__resolv__2B0A656D] FOREIGN KEY ([resolved_by]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[materials] WITH CHECK ADD CONSTRAINT [FK__materials__categ__4AB81AF0] FOREIGN KEY ([category_id]) REFERENCES [dbo].[material_categories] ([category_id]);
ALTER TABLE [dbo].[order_change_requests] WITH CHECK ADD CONSTRAINT [FK__order_cha__proce__3C34F16F] FOREIGN KEY ([processed_by]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[order_change_requests] WITH CHECK ADD CONSTRAINT [FK_change_request_seller] FOREIGN KEY ([order_id], [requested_by]) REFERENCES [dbo].[collection_orders] ([order_id], [seller_user_id]);
ALTER TABLE [dbo].[order_quotes] WITH CHECK ADD CONSTRAINT [FK__order_quo__creat__06CD04F7] FOREIGN KEY ([created_by]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[order_quotes] WITH CHECK ADD CONSTRAINT [FK__order_quo__order__00200768] FOREIGN KEY ([order_id]) REFERENCES [dbo].[collection_orders] ([order_id]);
ALTER TABLE [dbo].[order_quotes] WITH CHECK ADD CONSTRAINT [FK_quote_responding_seller] FOREIGN KEY ([order_id], [responded_by]) REFERENCES [dbo].[collection_orders] ([order_id], [seller_user_id]);
ALTER TABLE [dbo].[order_status_logs] WITH CHECK ADD CONSTRAINT [FK__order_sta__chang__32AB8735] FOREIGN KEY ([changed_by]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[order_status_logs] WITH CHECK ADD CONSTRAINT [FK__order_sta__new_c__3493CFA7] FOREIGN KEY ([new_collector_id]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[order_status_logs] WITH CHECK ADD CONSTRAINT [FK__order_sta__old_c__339FAB6E] FOREIGN KEY ([old_collector_id]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[order_status_logs] WITH CHECK ADD CONSTRAINT [FK__order_sta__order__2FCF1A8A] FOREIGN KEY ([order_id]) REFERENCES [dbo].[collection_orders] ([order_id]);
ALTER TABLE [dbo].[payments] WITH CHECK ADD CONSTRAINT [FK__payments__record__208CD6FA] FOREIGN KEY ([recorded_by]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[payments] WITH CHECK ADD CONSTRAINT [FK_payment_quote] FOREIGN KEY ([quote_id], [order_id], [amount]) REFERENCES [dbo].[order_quotes] ([quote_id], [order_id], [total_amount]);
ALTER TABLE [dbo].[price_rules] WITH CHECK ADD CONSTRAINT [FK__price_rul__appro__59063A47] FOREIGN KEY ([approved_by]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[price_rules] WITH CHECK ADD CONSTRAINT [FK__price_rul__creat__5812160E] FOREIGN KEY ([created_by]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[price_rules] WITH CHECK ADD CONSTRAINT [FK__price_rul__mater__534D60F1] FOREIGN KEY ([material_id]) REFERENCES [dbo].[materials] ([material_id]);
ALTER TABLE [dbo].[quote_items] WITH CHECK ADD CONSTRAINT [FK_quote_item_order] FOREIGN KEY ([item_id], [order_id]) REFERENCES [dbo].[collection_items] ([item_id], [order_id]);
ALTER TABLE [dbo].[quote_items] WITH CHECK ADD CONSTRAINT [FK_quote_item_price] FOREIGN KEY ([price_rule_id], [material_id], [unit_price_snapshot]) REFERENCES [dbo].[price_rules] ([price_rule_id], [material_id], [unit_price]);
ALTER TABLE [dbo].[quote_items] WITH CHECK ADD CONSTRAINT [FK_quote_item_quote] FOREIGN KEY ([quote_id], [order_id]) REFERENCES [dbo].[order_quotes] ([quote_id], [order_id]);
ALTER TABLE [dbo].[quote_items] WITH CHECK ADD CONSTRAINT [FK_quote_item_weighing] FOREIGN KEY ([weighing_id], [item_id]) REFERENCES [dbo].[weighing_records] ([weighing_id], [item_id]);
ALTER TABLE [dbo].[weighing_records] WITH CHECK ADD CONSTRAINT [FK__weighing___creat__76969D2E] FOREIGN KEY ([created_by]) REFERENCES [dbo].[users] ([user_id]);
ALTER TABLE [dbo].[weighing_records] WITH CHECK ADD CONSTRAINT [FK__weighing___item___74AE54BC] FOREIGN KEY ([item_id]) REFERENCES [dbo].[collection_items] ([item_id]);
ALTER TABLE [dbo].[weighing_records] WITH CHECK ADD CONSTRAINT [FK_weighing_correction] FOREIGN KEY ([correction_of], [item_id]) REFERENCES [dbo].[weighing_records] ([weighing_id], [item_id]);

EXEC sys.sp_addextendedproperty @name=N'VCoi.SchemaVersion', @value=N'2026-10-25.1';
ALTER TABLE [dbo].[collection_orders] WITH CHECK ADD CONSTRAINT [CK_collection_order_location] CHECK (([pickup_lat_snapshot] IS NULL AND [pickup_lng_snapshot] IS NULL) OR ([pickup_lat_snapshot] IS NOT NULL AND [pickup_lng_snapshot] IS NOT NULL AND [pickup_lat_snapshot] BETWEEN -90 AND 90 AND [pickup_lng_snapshot] BETWEEN -180 AND 180));
EXEC sys.sp_addextendedproperty @name=N'VCoi.PickupLocationVersion', @value=N'1';
COMMIT TRANSACTION;
END TRY
BEGIN CATCH
IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
THROW;
END CATCH;
GO
