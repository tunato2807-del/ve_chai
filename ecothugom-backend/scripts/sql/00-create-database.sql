-- SQLCMD mode; use initialize-demo-db.ps1 or supply -v DatabaseName=YourNewDatabase.
USE [master];
GO
SET NOCOUNT ON;
DECLARE @DatabaseName SYSNAME=N'$(DatabaseName)';
IF LEN(@DatabaseName)>64 OR @DatabaseName COLLATE Latin1_General_100_BIN2 LIKE N'%[^A-Za-z0-9_]%'
   OR LEFT(@DatabaseName,1) COLLATE Latin1_General_100_BIN2 NOT LIKE N'[A-Za-z]'
    THROW 54610, 'Database name must start with a letter and contain only letters, digits or underscore (max 64).', 1;
IF CONVERT(INT,SERVERPROPERTY('ProductMajorVersion'))<16
    THROW 54611, 'SQL Server 2022 or newer is required (compatibility level 160).', 1;
IF DB_ID(@DatabaseName) IS NOT NULL
    THROW 54612, 'Database already exists. No existing database has been replaced.', 1;
DECLARE @Sql NVARCHAR(MAX)=N'CREATE DATABASE '+QUOTENAME(@DatabaseName)+N' COLLATE SQL_Latin1_General_CP1_CI_AS;';
EXEC sys.sp_executesql @Sql;
SET @Sql=N'ALTER DATABASE '+QUOTENAME(@DatabaseName)+N' SET COMPATIBILITY_LEVEL=160;';
EXEC sys.sp_executesql @Sql;
PRINT N'Created database '+QUOTENAME(@DatabaseName)+N'.';
GO
