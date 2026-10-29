param(
    [Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$ServerInstance,
    [ValidatePattern('^[A-Za-z][A-Za-z0-9_]{0,63}$')][string]$DatabaseName='EcoThuGomDemo',
    [PSCredential]$Credential,
    [switch]$TrustServerCertificate
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$sqlcmd=(Get-Command sqlcmd -ErrorAction Stop).Source
$sqlDirectory=Join-Path $PSScriptRoot 'sql'
$common=@('-S',$ServerInstance,'-l','10','-b','-r','1','-f','65001')
if($TrustServerCertificate){$common+='-C'}
$oldPassword=[Environment]::GetEnvironmentVariable('SQLCMDPASSWORD','Process')
$pointer=[IntPtr]::Zero
try {
    if($Credential){
        $common+=@('-U',$Credential.UserName)
        $pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($Credential.Password)
        $env:SQLCMDPASSWORD=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    } else {$common+='-E'}
    # The create step refuses an existing name before any schema/seed operation.
    & $sqlcmd @common -d master -v "DatabaseName=$DatabaseName" -i (Join-Path $sqlDirectory '00-create-database.sql')
    if($LASTEXITCODE-ne 0){throw 'Database creation failed; existing databases were not replaced.'}
    foreach($file in @('01-schema.sql','seed-sample-data.sql')){
        Write-Host "Applying $file to $DatabaseName..."
        & $sqlcmd @common -d $DatabaseName -v "DatabaseName=$DatabaseName" -i (Join-Path $sqlDirectory $file)
        if($LASTEXITCODE-ne 0){throw "Failed at $file. The new database is kept for inspection; do not use it until verification passes."}
    }
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
    $sanitySql=@"
SET NOCOUNT ON;
$snapshotSql
IF @Actual<>'0BE24917CBDF3FAE15FB3E9DAE726E2A72D2969EECC5FEF8AAC24274A9BB3245'
    THROW 52009,N'Schema không khớp với cấu trúc VCoi hiện hành.',1;
IF (SELECT COUNT(*) FROM sys.computed_columns WHERE is_persisted=1)<>3
    THROW 52013,N'Thiếu cột tính toán PERSISTED trong schema.',1;
IF NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE class=0 AND name=N'VCoi.SchemaVersion' AND CONVERT(NVARCHAR(100),value)=N'2026-10-25.1')
    THROW 52014,N'Thiếu dấu phiên bản schema VCoi.',1;
IF NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE class=0 AND name=N'VCoi.PickupLocationVersion' AND CONVERT(NVARCHAR(100),value)=N'1')
    THROW 52015,N'Thiếu migration tọa độ thu gom.',1;
IF OBJECT_ID(N'dbo.users',N'U') IS NULL OR OBJECT_ID(N'dbo.materials',N'U') IS NULL OR OBJECT_ID(N'dbo.collection_orders',N'U') IS NULL OR OBJECT_ID(N'dbo.price_rules',N'U') IS NULL
    THROW 52010,N'Bộ schema VCoi chưa đầy đủ.',1;
IF (SELECT COUNT(*) FROM dbo.users WHERE email IN(N'admin@ecothugom.example',N'collector1@ecothugom.example',N'collector2@ecothugom.example',N'customer1@ecothugom.example',N'customer2@ecothugom.example'))<>5
    THROW 52011,N'Thiếu tài khoản DEMO; hãy kiểm tra seed.',1;
IF (SELECT COUNT(*) FROM dbo.collection_orders WHERE code IN('DEMO-0001','DEMO-0002','DEMO-0003','DEMO-0004','DEMO-0005','DEMO-0006','DEMO-0007','DEMO-0008'))<>8
    THROW 52012,N'Thiếu đơn DEMO; hãy kiểm tra seed.',1;
SELECT 'PASS' AS result,5 AS demo_accounts,8 AS demo_orders;
"@
    Write-Host "Checking required VCoi tables and demo records in $DatabaseName..."
    & $sqlcmd @common -d $DatabaseName -Q $sanitySql
    if($LASTEXITCODE-ne 0){throw 'Demo data sanity check failed. The new database is kept for inspection; do not use it until corrected.'}
    Write-Host "VCoi demo database ready: $DatabaseName on $ServerInstance."
    Write-Host 'Seeded DEMO accounts have no published password. Provision your own admin, customer and collector as described in README.'
} finally {
    if($pointer-ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)}
    [Environment]::SetEnvironmentVariable('SQLCMDPASSWORD',$oldPassword,'Process')
}
