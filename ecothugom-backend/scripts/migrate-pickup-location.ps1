param(
    [ValidatePattern('^[A-Za-z0-9._\\,-]+$')][string]$ServerInstance='localhost,1435',
    [ValidatePattern('^[A-Za-z][A-Za-z0-9_]{0,127}$')][string]$DatabaseName='EcoThuGomDB',
    [switch]$TrustServerCertificate
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$backend=Split-Path -Parent $PSScriptRoot
$output=Join-Path $backend ('.local\migrations\pickup-location-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $output -Force|Out-Null

# Keep the migration's schema guard self-contained: verification assets are archived separately.
# This snapshot must remain byte-for-byte equivalent to the one used by the schema verifier.
$snapshotSql=@'
DECLARE @Snapshot NVARCHAR(MAX)=(SELECT
(JSON_QUERY((SELECT t.name,c.column_id,c.name AS [column],ty.name AS [type],c.max_length,c.precision,c.scale,c.is_nullable,c.collation_name,ic.seed_value,ic.increment_value,cc.definition AS computed,dc.name AS default_name,dc.definition AS [default]
 FROM sys.tables t JOIN sys.columns c ON t.object_id=c.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id LEFT JOIN sys.identity_columns ic ON ic.object_id=c.object_id AND ic.column_id=c.column_id LEFT JOIN sys.computed_columns cc ON cc.object_id=c.object_id AND cc.column_id=c.column_id LEFT JOIN sys.default_constraints dc ON dc.object_id=c.default_object_id WHERE t.is_ms_shipped=0 ORDER BY t.name,c.column_id FOR JSON PATH))) AS [columns],
(JSON_QUERY((SELECT OBJECT_NAME(i.object_id) AS [table],i.name,i.type_desc,i.is_unique,i.is_primary_key,i.is_unique_constraint,i.filter_definition,ic.key_ordinal,ic.is_descending_key,ic.is_included_column,c.name AS [column]
 FROM sys.indexes i JOIN sys.index_columns ic ON i.object_id=ic.object_id AND i.index_id=ic.index_id JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE i.index_id>0 AND OBJECTPROPERTY(i.object_id,'IsUserTable')=1 ORDER BY [table],i.name,ic.index_column_id FOR JSON PATH))) AS indexes,
(JSON_QUERY((SELECT OBJECT_NAME(parent_object_id) AS [table],name,definition,is_disabled,is_not_trusted FROM sys.check_constraints ORDER BY [table],name FOR JSON PATH))) AS checks,
(JSON_QUERY((SELECT OBJECT_NAME(f.parent_object_id) AS [table],f.name,c.name AS [column],OBJECT_NAME(f.referenced_object_id) AS referenced_table,rc.name AS referenced_column,k.constraint_column_id,f.delete_referential_action_desc,f.update_referential_action_desc,f.is_disabled,f.is_not_trusted FROM sys.foreign_keys f JOIN sys.foreign_key_columns k ON f.object_id=k.constraint_object_id JOIN sys.columns c ON c.object_id=k.parent_object_id AND c.column_id=k.parent_column_id JOIN sys.columns rc ON rc.object_id=k.referenced_object_id AND rc.column_id=k.referenced_column_id ORDER BY [table],f.name,k.constraint_column_id FOR JSON PATH))) AS foreign_keys FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
DECLARE @Actual VARCHAR(64)=CONVERT(VARCHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),@Snapshot)),2);
'@
$baselineSql=@"
USE [$DatabaseName];
SET NOCOUNT ON;
IF DB_ID()<=4 THROW 54705,'Select the intended VCoi user database.',1;
$snapshotSql
IF @Actual NOT IN('8A57189B382A9CB63784B204302E27AC238F0BDB67985C27523ED582B29489DF','0BE24917CBDF3FAE15FB3E9DAE726E2A72D2969EECC5FEF8AAC24274A9BB3245')
    THROW 54705,'Database differs from the supported VCoi schemas; nothing was migrated.',1;
IF EXISTS(SELECT 1 FROM sys.extended_properties WHERE class=0 AND name=N'VCoi.SchemaVersion' AND CONVERT(NVARCHAR(100),value)<>N'2026-10-25.1')
    THROW 54706,'Unexpected VCoi schema ownership marker.',1;
IF NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE class=0 AND name=N'VCoi.SchemaVersion')
    EXEC sys.sp_addextendedproperty @name=N'VCoi.SchemaVersion',@value=N'2026-10-25.1';
SELECT 'PASS supported baseline' AS result,@Actual AS fingerprint;
"@
$postMigrationSql=@"
USE [$DatabaseName];
SET NOCOUNT ON;
$snapshotSql
IF @Actual<>'0BE24917CBDF3FAE15FB3E9DAE726E2A72D2969EECC5FEF8AAC24274A9BB3245'
    THROW 54708,'Migrated schema does not match the supported application schema.',1;
IF (SELECT COUNT(*) FROM sys.computed_columns WHERE is_persisted=1)<>3
    THROW 54709,'All three calculated quantity/amount columns must be persisted.',1;
IF NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE class=0 AND name=N'VCoi.SchemaVersion' AND CONVERT(NVARCHAR(100),value)=N'2026-10-25.1')
    THROW 54710,'Missing VCoi schema version marker.',1;
IF NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE class=0 AND name=N'VCoi.PickupLocationVersion' AND CONVERT(NVARCHAR(100),value)=N'1')
    THROW 54711,'Pickup-location migration marker is missing.',1;
SELECT 'PASS' AS result,'pickup-location-1' AS migration,@Actual AS schema_fingerprint;
"@
$baseline=Join-Path $output 'baseline.sql'
$post=Join-Path $output 'post-migration.sql'
Set-Content -LiteralPath $baseline -Value $baselineSql -Encoding utf8
Set-Content -LiteralPath $post -Value $postMigrationSql -Encoding utf8
$connection=@('-S',$ServerInstance,'-E','-b','-f','65001','-v',('DatabaseName='+$DatabaseName))
if($TrustServerCertificate){$connection+='-C'}
$steps=@(
    @{Path=$baseline;Name='baseline'},
    @{Path=(Join-Path $PSScriptRoot 'sql\02-pickup-location.sql');Name='pickup-location-1'},
    @{Path=$post;Name='post-migration verification'}
)
foreach($step in $steps){
    & sqlcmd @connection -i $step.Path
    if($LASTEXITCODE-ne 0){throw ('Migration stopped at '+$step.Name+'. Database was not replaced or cleared.')}
}
[pscustomobject]@{Result='PASS';Database=$DatabaseName;Migration='pickup-location-1';Output=$output}
