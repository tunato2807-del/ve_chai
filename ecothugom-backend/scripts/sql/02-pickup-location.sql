/* Additive migration. Set DatabaseName to the intended VCoi database; existing rows remain intact. */
USE [$(DatabaseName)];
GO
SET XACT_ABORT ON;
SET NOCOUNT ON;
IF DB_ID()<=4 OR NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE class=0 AND name=N'VCoi.SchemaVersion' AND CONVERT(NVARCHAR(100),value)=N'2026-10-25.1')
    THROW 54700,'Select an initialized VCoi user database.',1;
IF OBJECT_ID(N'dbo.addresses',N'U') IS NULL OR COL_LENGTH(N'dbo.addresses',N'lat') IS NULL OR COL_LENGTH(N'dbo.addresses',N'lng') IS NULL
    THROW 54701,'Expected VCoi address coordinate columns are missing.',1;
BEGIN TRY
BEGIN TRANSACTION;
IF COL_LENGTH(N'dbo.collection_orders',N'pickup_lat_snapshot') IS NULL
    ALTER TABLE dbo.collection_orders ADD pickup_lat_snapshot DECIMAL(9,6) NULL;
IF COL_LENGTH(N'dbo.collection_orders',N'pickup_lng_snapshot') IS NULL
    ALTER TABLE dbo.collection_orders ADD pickup_lng_snapshot DECIMAL(9,6) NULL;
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.collection_orders') AND name IN(N'pickup_lat_snapshot',N'pickup_lng_snapshot') AND (TYPE_NAME(user_type_id)<>N'decimal' OR precision<>9 OR scale<>6 OR is_nullable<>1))
    THROW 54702,'Unexpected pickup coordinate column definition; no migration applied.',1;
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.collection_orders') AND name=N'CK_collection_order_location')
    EXEC(N'ALTER TABLE [dbo].[collection_orders] WITH CHECK ADD CONSTRAINT [CK_collection_order_location] CHECK (([pickup_lat_snapshot] IS NULL AND [pickup_lng_snapshot] IS NULL) OR ([pickup_lat_snapshot] IS NOT NULL AND [pickup_lng_snapshot] IS NOT NULL AND [pickup_lat_snapshot] BETWEEN -90 AND 90 AND [pickup_lng_snapshot] BETWEEN -180 AND 180));');
IF NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE class=0 AND name=N'VCoi.PickupLocationVersion')
    EXEC sys.sp_addextendedproperty @name=N'VCoi.PickupLocationVersion',@value=N'1';
COMMIT TRANSACTION;
END TRY
BEGIN CATCH
IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
THROW;
END CATCH;
SELECT 'PASS' AS result,'pickup-location-1' AS migration;
GO
