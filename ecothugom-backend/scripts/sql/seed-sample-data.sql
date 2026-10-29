/*
  EcoThuGom - synthetic demonstration data for one collection dealer.
  All prices, people, addresses and payments are fictional.
  No schema changes, DELETE, TRUNCATE, IDENTITY_INSERT or real payment calls.
  Natural demo keys make an unchanged dataset safe to seed repeatedly.
*/
-- Select the intended database in SSMS or use sqlcmd -d DatabaseName.
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

IF DB_ID()<=4 OR (DB_NAME()<>N'EcoThuGomDB' AND NOT EXISTS(
    SELECT 1 FROM sys.extended_properties WHERE class=0 AND name=N'VCoi.SchemaVersion' AND CONVERT(NVARCHAR(100),value)=N'2026-10-25.1'))
    THROW 52100, N'Phải chọn database VCoi/EcoThuGom đã tạo bằng bộ schema.', 1;
IF OBJECT_ID(N'dbo.order_change_requests',N'U') IS NULL
    THROW 52101, N'Thiếu cấu trúc database. Hãy chạy script tạo 14 bảng trước.', 1;

DECLARE @OwnTransaction BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;
IF @OwnTransaction=1 BEGIN TRANSACTION;
ELSE SAVE TRANSACTION EcoDemoSeed;

BEGIN TRY
    DECLARE @LockResult INT;
    EXEC @LockResult=sys.sp_getapplock
        @Resource=N'EcoThuGom:demo-seed:v1', @LockMode='Exclusive',
        @LockOwner='Transaction', @LockTimeout=10000;
    IF @LockResult<0 THROW 52102, N'Chưa lấy được khóa để tạo dữ liệu mẫu.', 1;

    -- Keep every timestamp stable when running the same seed again.
    DECLARE @AnchorUtc DATETIME2(3)=(
        SELECT created_at FROM dbo.collection_orders WHERE code='DEMO-0001'
    );
    SET @AnchorUtc=ISNULL(@AnchorUtc,SYSUTCDATETIME());

    -- BCrypt of a random, discarded value; this seed does not publish login credentials.
    DECLARE @PasswordHash VARCHAR(255)='$2b$12$OZrNIXn8rx.ucoHgYc1aae3oMl5PylztnBg8IYrgQ7lZSilJs1tpe';
    DECLARE @Users TABLE (
        phone VARCHAR(20) PRIMARY KEY, full_name NVARCHAR(100),
        email NVARCHAR(254), role VARCHAR(20)
    );
    INSERT INTO @Users VALUES
        ('0000000001',N'DEMO Quản trị đại lý',N'admin@ecothugom.example','ADMIN'),
        ('0000000002',N'DEMO Nhân viên thu gom 01',N'collector1@ecothugom.example','COLLECTOR'),
        ('0000000003',N'DEMO Nhân viên thu gom 02',N'collector2@ecothugom.example','COLLECTOR'),
        ('0000000004',N'DEMO Khách hàng 01',N'customer1@ecothugom.example','CUSTOMER'),
        ('0000000005',N'DEMO Khách hàng 02',N'customer2@ecothugom.example','CUSTOMER');

    IF EXISTS (
        SELECT 1 FROM @Users s JOIN dbo.users u ON u.phone=s.phone
        WHERE ISNULL(u.email,N'')<>s.email OR u.role<>s.role OR u.full_name NOT LIKE N'DEMO %'
    ) OR EXISTS (
        SELECT 1 FROM @Users s JOIN dbo.users u ON u.email=s.email WHERE u.phone<>s.phone
    )
        THROW 52103, N'Số điện thoại/email mẫu đang thuộc tài khoản khác. Không ghi đè.', 1;

    INSERT INTO dbo.users(full_name,phone,email,password_hash,role,status,created_at,updated_at)
    SELECT s.full_name,s.phone,s.email,@PasswordHash,s.role,'ACTIVE',
           DATEADD(DAY,-200,@AnchorUtc),@AnchorUtc
    FROM @Users s WHERE NOT EXISTS (SELECT 1 FROM dbo.users u WHERE u.phone=s.phone);

    DECLARE @Admin BIGINT=(SELECT user_id FROM dbo.users WHERE phone='0000000001');
    DECLARE @Collector1 BIGINT=(SELECT user_id FROM dbo.users WHERE phone='0000000002');
    DECLARE @Collector2 BIGINT=(SELECT user_id FROM dbo.users WHERE phone='0000000003');
    DECLARE @Customer1 BIGINT=(SELECT user_id FROM dbo.users WHERE phone='0000000004');
    DECLARE @Customer2 BIGINT=(SELECT user_id FROM dbo.users WHERE phone='0000000005');

    INSERT INTO dbo.addresses(
        user_id,contact_name,contact_phone,address_line,ward,district,province,is_default,created_at
    )
    SELECT u.user_id,u.full_name,u.phone,v.address_line,N'Phường mô phỏng',NULL,N'TP Hồ Chí Minh',
           CASE WHEN EXISTS (SELECT 1 FROM dbo.addresses a WHERE a.user_id=u.user_id AND a.is_default=1)
                THEN 0 ELSE 1 END,
           DATEADD(DAY,-60,@AnchorUtc)
    FROM (VALUES
        (@Customer1,N'[DEMO] Địa chỉ mô phỏng 01 - không dùng giao nhận thực tế'),
        (@Customer2,N'[DEMO] Địa chỉ mô phỏng 02 - không dùng giao nhận thực tế')
    ) v(user_id,address_line)
    JOIN dbo.users u ON u.user_id=v.user_id
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.addresses a WHERE a.user_id=v.user_id AND a.address_line=v.address_line
    );
    DECLARE @Address1 BIGINT=(
        SELECT address_id FROM dbo.addresses WHERE user_id=@Customer1
          AND address_line=N'[DEMO] Địa chỉ mô phỏng 01 - không dùng giao nhận thực tế'
    );
    DECLARE @Address2 BIGINT=(
        SELECT address_id FROM dbo.addresses WHERE user_id=@Customer2
          AND address_line=N'[DEMO] Địa chỉ mô phỏng 02 - không dùng giao nhận thực tế'
    );

    DECLARE @Materials TABLE (
        material_key VARCHAR(20) PRIMARY KEY, category_name NVARCHAR(100),
        name NVARCHAR(150),grade NVARCHAR(50),unit_price DECIMAL(18,0),
        material_id INT,price_rule_id BIGINT
    );
    INSERT INTO @Materials(material_key,category_name,name,grade,unit_price) VALUES
        ('CARTON',N'Giấy',N'Giấy carton',N'Khô sạch',3500),
        ('NEWSPAPER',N'Giấy',N'Giấy báo',N'Khô sạch',3000),
        ('OFFICE',N'Giấy',N'Giấy văn phòng',N'Đã phân loại',4200),
        ('PET',N'Nhựa',N'Chai nhựa PET',N'Đã phân loại',6000),
        ('HDPE',N'Nhựa',N'Nhựa HDPE',N'Đã phân loại',9000),
        ('MIXED',N'Nhựa',N'Nhựa hỗn hợp',N'Cần kiểm tra',NULL),
        ('CAN',N'Kim loại',N'Lon nhôm',N'Đã phân loại',22000),
        ('IRON',N'Kim loại',N'Sắt vụn',N'Thông thường',7000),
        ('COPPER',N'Kim loại',N'Đồng đỏ',N'Loại 1',165000);

    INSERT INTO dbo.material_categories(name)
    SELECT DISTINCT s.category_name FROM @Materials s
    WHERE NOT EXISTS (SELECT 1 FROM dbo.material_categories c WHERE c.name=s.category_name);

    INSERT INTO dbo.materials(category_id,name,grade,unit,description,accepted)
    SELECT c.category_id,s.name,s.grade,'KG',N'[DEMO] Vật liệu mẫu phục vụ kiểm thử đồ án.',1
    FROM @Materials s JOIN dbo.material_categories c ON c.name=s.category_name
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.materials m
        WHERE m.category_id=c.category_id AND m.name=s.name AND m.grade=s.grade
    );
    UPDATE s SET material_id=m.material_id
    FROM @Materials s
    JOIN dbo.material_categories c ON c.name=s.category_name
    JOIN dbo.materials m ON m.category_id=c.category_id AND m.name=s.name AND m.grade=s.grade;

    IF EXISTS (
        SELECT 1 FROM @Materials s JOIN dbo.materials m ON m.material_id=s.material_id
        JOIN dbo.material_categories c ON c.category_id=m.category_id
        WHERE m.accepted<>1 OR c.is_active<>1
    )
        THROW 52104, N'Vật liệu/nhóm mẫu đã bị ngừng hoạt động. Không tự bật lại dữ liệu đã chỉnh.', 1;

    DECLARE @Prices TABLE (
        material_key VARCHAR(20),version_number INT,unit_price DECIMAL(18,0),
        valid_from DATETIME2(3),valid_to DATETIME2(3),approval_status VARCHAR(20),
        created_at DATETIME2(3),approved_at DATETIME2(3),
        PRIMARY KEY(material_key,version_number)
    );
    INSERT INTO @Prices
    SELECT material_key,CASE WHEN material_key='CARTON' THEN 2 ELSE 1 END,unit_price,
           DATEADD(DAY,-30,@AnchorUtc),NULL,'APPROVED',
           DATEADD(DAY,-45,@AnchorUtc),DATEADD(DAY,-31,@AnchorUtc)
    FROM @Materials WHERE unit_price IS NOT NULL;
    INSERT INTO @Prices VALUES
        ('CARTON',1,3000,DATEADD(DAY,-180,@AnchorUtc),DATEADD(DAY,-30,@AnchorUtc),'APPROVED',
            DATEADD(DAY,-185,@AnchorUtc),DATEADD(DAY,-181,@AnchorUtc)),
        ('CARTON',3,4000,DATEADD(DAY,30,@AnchorUtc),NULL,'APPROVED',
            DATEADD(DAY,-2,@AnchorUtc),DATEADD(DAY,-1,@AnchorUtc)),
        ('CARTON',4,4500,@AnchorUtc,NULL,'DRAFT',DATEADD(DAY,-1,@AnchorUtc),NULL),
        ('PET',2,6500,@AnchorUtc,NULL,'REJECTED',DATEADD(DAY,-2,@AnchorUtc),NULL);

    IF EXISTS (
        SELECT 1 FROM @Prices s JOIN @Materials m ON m.material_key=s.material_key
        JOIN dbo.price_rules p ON p.material_id=m.material_id AND p.version_number=s.version_number
        WHERE p.created_by<>@Admin OR p.unit_price<>s.unit_price
    )
        THROW 52105, N'Phiên bản giá mẫu trùng với giá khác hoặc đã được chỉnh. Không ghi đè.', 1;

    INSERT INTO dbo.price_rules(
        material_id,unit_price,valid_from,valid_to,approval_status,version_number,
        created_by,approved_by,approved_at,created_at
    )
    SELECT m.material_id,s.unit_price,s.valid_from,s.valid_to,s.approval_status,s.version_number,
           @Admin,CASE WHEN s.approval_status='APPROVED' THEN @Admin END,s.approved_at,s.created_at
    FROM @Prices s JOIN @Materials m ON m.material_key=s.material_key
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.price_rules p WHERE p.material_id=m.material_id AND p.version_number=s.version_number
    );
    UPDATE m SET price_rule_id=p.price_rule_id
    FROM @Materials m JOIN dbo.price_rules p ON p.material_id=m.material_id
      AND p.version_number=CASE WHEN m.material_key='CARTON' THEN 2 ELSE 1 END
    WHERE m.unit_price IS NOT NULL;

    DECLARE @Orders TABLE (
        code VARCHAR(40) PRIMARY KEY,seller BIGINT,address_id BIGINT,collector BIGINT,
        status VARCHAR(30),last_stage INT,created_at DATETIME2(3),pickup_start DATETIME2(3)
    );
    INSERT INTO @Orders VALUES
        ('DEMO-0001',@Customer1,@Address1,NULL,'PENDING',0,@AnchorUtc,DATEADD(DAY,2,@AnchorUtc)),
        ('DEMO-0002',@Customer2,@Address2,NULL,'CONFIRMED',1,DATEADD(HOUR,-2,@AnchorUtc),DATEADD(DAY,1,@AnchorUtc)),
        ('DEMO-0003',@Customer1,@Address1,@Collector1,'ASSIGNED',2,DATEADD(HOUR,-3,@AnchorUtc),DATEADD(HOUR,27,@AnchorUtc)),
        ('DEMO-0004',@Customer2,@Address2,@Collector2,'AWAITING_SELLER_APPROVAL',5,DATEADD(HOUR,-6,@AnchorUtc),DATEADD(HOUR,-2,@AnchorUtc)),
        ('DEMO-0005',@Customer1,@Address1,@Collector1,'AWAITING_PAYMENT',6,DATEADD(DAY,-1,@AnchorUtc),DATEADD(HOUR,-6,@AnchorUtc)),
        ('DEMO-0006',@Customer2,@Address2,@Collector2,'COMPLETED',7,DATEADD(DAY,-4,@AnchorUtc),DATEADD(DAY,-3,@AnchorUtc)),
        ('DEMO-0007',@Customer1,@Address1,NULL,'CANCELLED',2,DATEADD(DAY,-2,@AnchorUtc),DATEADD(DAY,1,@AnchorUtc)),
        ('DEMO-0008',@Customer2,@Address2,@Collector1,'DISPUTED',8,DATEADD(DAY,-3,@AnchorUtc),DATEADD(DAY,-2,@AnchorUtc));

    IF EXISTS (
        SELECT 1 FROM @Orders s JOIN dbo.collection_orders o ON o.code=s.code
        WHERE o.seller_user_id<>s.seller OR ISNULL(o.seller_note,N'') NOT LIKE N'[[]DEMO]%'
    )
        THROW 52106, N'Mã đơn DEMO đang thuộc dữ liệu khác. Không ghi đè.', 1;

    INSERT INTO dbo.collection_orders(
        code,seller_user_id,collector_id,source_address_id,contact_name_snapshot,contact_phone_snapshot,
        address_snapshot,pickup_start,pickup_end,status,seller_note,cancelled_at,cancellation_reason,
        completed_at,version,created_at,updated_at
    )
    SELECT s.code,s.seller,s.collector,s.address_id,a.contact_name,a.contact_phone,
           CONCAT(a.address_line,N', ',a.ward,N', ',a.province),
           s.pickup_start,DATEADD(HOUR,1,s.pickup_start),s.status,N'[DEMO] Đơn thu mua giả định cho đồ án.',
           CASE WHEN s.status='CANCELLED' THEN DATEADD(MINUTE,25,s.created_at) END,
           CASE WHEN s.status='CANCELLED' THEN N'[DEMO] Khách không còn nhu cầu thu gom.' END,
           CASE WHEN s.status IN ('COMPLETED','DISPUTED') THEN DATEADD(MINUTE,45,s.pickup_start) END,
           s.last_stage+CASE WHEN s.code IN ('DEMO-0003','DEMO-0004') THEN 1 ELSE 0 END,
           s.created_at,
           CASE
               WHEN s.code='DEMO-0003' THEN DATEADD(HOUR,-1,@AnchorUtc)
               WHEN s.status='PENDING' THEN s.created_at
               WHEN s.status='CONFIRMED' THEN DATEADD(MINUTE,10,s.created_at)
               WHEN s.status='AWAITING_SELLER_APPROVAL' THEN DATEADD(MINUTE,20,s.pickup_start)
               WHEN s.status='AWAITING_PAYMENT' THEN DATEADD(MINUTE,30,s.pickup_start)
               WHEN s.status='COMPLETED' THEN DATEADD(MINUTE,45,s.pickup_start)
               WHEN s.status='CANCELLED' THEN DATEADD(MINUTE,25,s.created_at)
               WHEN s.status='DISPUTED' THEN DATEADD(MINUTE,90,s.pickup_start)
           END
    FROM @Orders s JOIN dbo.addresses a ON a.address_id=s.address_id
    WHERE NOT EXISTS (SELECT 1 FROM dbo.collection_orders o WHERE o.code=s.code);

    DECLARE @Items TABLE(code VARCHAR(40),material_key VARCHAR(20),estimated_qty DECIMAL(12,3));
    INSERT INTO @Items VALUES
        ('DEMO-0001','CARTON',20),('DEMO-0001','PET',5),
        ('DEMO-0002','IRON',15),('DEMO-0002','COPPER',1),
        ('DEMO-0003','OFFICE',12),('DEMO-0003','HDPE',6),
        ('DEMO-0004','CAN',4.8),('DEMO-0004','CARTON',10),
        ('DEMO-0005','CARTON',12),('DEMO-0005','PET',3),
        ('DEMO-0006','IRON',25),('DEMO-0006','COPPER',2),
        ('DEMO-0007','MIXED',8),('DEMO-0007','CARTON',5),
        ('DEMO-0008','CAN',6),('DEMO-0008','PET',10);
    INSERT INTO dbo.collection_items(
        order_id,material_id,estimated_qty,estimated_price_rule_id,estimated_unit_price,note
    )
    SELECT o.order_id,m.material_id,s.estimated_qty,m.price_rule_id,m.unit_price,
           CASE WHEN m.unit_price IS NULL THEN N'[DEMO] Cần nhân viên kiểm tra và báo giá.'
                ELSE N'[DEMO] Khối lượng khách ước tính.' END
    FROM @Items s JOIN dbo.collection_orders o ON o.code=s.code
    JOIN @Materials m ON m.material_key=s.material_key
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.collection_items i WHERE i.order_id=o.order_id AND i.material_id=m.material_id
    );

    DECLARE @Weights TABLE(
        code VARCHAR(40),material_key VARCHAR(20),gross DECIMAL(12,3),tare DECIMAL(12,3),minute_offset INT
    );
    INSERT INTO @Weights VALUES
        ('DEMO-0004','CAN',5.1,0.2,8),('DEMO-0004','CARTON',10.5,0.5,9),
        ('DEMO-0005','CARTON',12.1,0.3,8),('DEMO-0005','PET',3.5,0.3,9),
        ('DEMO-0006','IRON',25,0.5,8),('DEMO-0006','COPPER',2.15,0.05,9),
        ('DEMO-0008','CAN',6.25,0.25,8),('DEMO-0008','PET',10,0.5,9);
    INSERT INTO dbo.weighing_records(item_id,gross_weight,tare_weight,created_by,created_at)
    SELECT i.item_id,s.gross,s.tare,o.collector_id,DATEADD(MINUTE,s.minute_offset,o.pickup_start)
    FROM @Weights s JOIN dbo.collection_orders o ON o.code=s.code
    JOIN @Materials m ON m.material_key=s.material_key
    JOIN dbo.collection_items i ON i.order_id=o.order_id AND i.material_id=m.material_id
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.weighing_records w WHERE w.item_id=i.item_id AND w.correction_of IS NULL
          AND w.created_at=DATEADD(MINUTE,s.minute_offset,o.pickup_start)
    );

    -- Keep the original measurement and append one correction on the same item.
    INSERT INTO dbo.weighing_records(
        item_id,gross_weight,tare_weight,created_by,created_at,correction_of,correction_reason
    )
    SELECT i.item_id,5.2,0.2,o.collector_id,DATEADD(MINUTE,12,o.pickup_start),
           original.weighing_id,N'[DEMO] Cân lại sau khi đặt cân trên mặt phẳng.'
    FROM dbo.collection_orders o
    JOIN @Materials m ON m.material_key='CAN'
    JOIN dbo.collection_items i ON i.order_id=o.order_id AND i.material_id=m.material_id
    JOIN dbo.weighing_records original ON original.item_id=i.item_id AND original.correction_of IS NULL
      AND original.created_at=DATEADD(MINUTE,8,o.pickup_start)
    WHERE o.code='DEMO-0004'
      AND NOT EXISTS (SELECT 1 FROM dbo.weighing_records c WHERE c.correction_of=original.weighing_id);

    DECLARE @Quotes TABLE(
        code VARCHAR(40),version_number INT,status VARCHAR(20),is_current BIT,
        created_minute INT,sent_minute INT,responded_minute INT,
        PRIMARY KEY(code,version_number)
    );
    INSERT INTO @Quotes VALUES
        ('DEMO-0004',1,'SUPERSEDED',0,10,11,NULL),
        ('DEMO-0004',2,'SENT',1,15,20,NULL),
        ('DEMO-0005',1,'ACCEPTED',1,15,20,30),
        ('DEMO-0006',1,'ACCEPTED',1,15,20,30),
        ('DEMO-0008',1,'ACCEPTED',1,15,20,30);
    DECLARE @QuoteLines TABLE(
        code VARCHAR(40),quote_version INT,order_id BIGINT,item_id BIGINT,weighing_id BIGINT,
        material_id INT,price_rule_id BIGINT,name NVARCHAR(150),grade NVARCHAR(50),
        qty DECIMAL(12,3),unit_price DECIMAL(18,0)
    );
    INSERT INTO @QuoteLines
    SELECT q.code,q.version_number,o.order_id,i.item_id,w.weighing_id,m.material_id,
           i.estimated_price_rule_id,m.name,m.grade,w.net_weight,i.estimated_unit_price
    FROM @Quotes q JOIN dbo.collection_orders o ON o.code=q.code
    JOIN dbo.collection_items i ON i.order_id=o.order_id
    JOIN dbo.materials m ON m.material_id=i.material_id
    CROSS APPLY (
        SELECT TOP (1) r.weighing_id,r.net_weight FROM dbo.weighing_records r
        WHERE r.item_id=i.item_id AND (
            q.code<>'DEMO-0004' OR q.version_number<>1 OR r.correction_of IS NULL
        )
        ORDER BY r.weighing_id DESC
    ) w;

    INSERT INTO dbo.order_quotes(
        order_id,version_number,status,is_current,total_amount,valid_until,
        created_by,created_at,sent_at,responded_by,responded_at,response_note,version
    )
    SELECT o.order_id,q.version_number,q.status,q.is_current,
           (SELECT SUM(CAST(ROUND(l.qty*l.unit_price,0) AS DECIMAL(18,0))) FROM @QuoteLines l
            WHERE l.code=q.code AND l.quote_version=q.version_number),
           DATEADD(DAY,1,DATEADD(MINUTE,q.created_minute,o.pickup_start)),
           o.collector_id,DATEADD(MINUTE,q.created_minute,o.pickup_start),
           DATEADD(MINUTE,q.sent_minute,o.pickup_start),
           CASE WHEN q.responded_minute IS NOT NULL THEN o.seller_user_id END,
           DATEADD(MINUTE,q.responded_minute,o.pickup_start),
           CASE WHEN q.responded_minute IS NOT NULL THEN N'[DEMO] Khách đồng ý báo giá sau khi đối chiếu cân.' END,
           CASE WHEN q.status='ACCEPTED' THEN 2 ELSE 1 END
    FROM @Quotes q JOIN dbo.collection_orders o ON o.code=q.code
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.order_quotes existing WHERE existing.order_id=o.order_id
          AND existing.version_number=q.version_number
    );

    INSERT INTO dbo.quote_items(
        quote_id,order_id,item_id,weighing_id,material_id,price_rule_id,
        material_name_snapshot,grade_snapshot,unit_snapshot,actual_qty,unit_price_snapshot,adjustment_reason
    )
    SELECT q.quote_id,l.order_id,l.item_id,l.weighing_id,l.material_id,l.price_rule_id,
           l.name,l.grade,'KG',l.qty,l.unit_price,
           CASE WHEN w.correction_of IS NOT NULL THEN N'[DEMO] Báo giá dùng kết quả cân đã hiệu chỉnh.' END
    FROM @QuoteLines l
    JOIN dbo.order_quotes q ON q.order_id=l.order_id AND q.version_number=l.quote_version
    JOIN dbo.weighing_records w ON w.weighing_id=l.weighing_id
    WHERE NOT EXISTS (SELECT 1 FROM dbo.quote_items i WHERE i.quote_id=q.quote_id AND i.item_id=l.item_id);

    DECLARE @Payments TABLE(
        code VARCHAR(40),method VARCHAR(30),status VARCHAR(20),
        request_key UNIQUEIDENTIFIER,reference_code VARCHAR(100),created_minute INT,paid_minute INT
    );
    INSERT INTO @Payments VALUES
        ('DEMO-0005','TRANSFER_SIMULATED','FAILED','d0e00005-0000-4000-8000-000000000001','DEMO-PAY-0005-FAILED',35,NULL),
        ('DEMO-0005','TRANSFER_SIMULATED','PENDING','d0e00005-0000-4000-8000-000000000002','DEMO-PAY-0005-PENDING',36,NULL),
        ('DEMO-0006','CASH_SIMULATED','COMPLETED','d0e00006-0000-4000-8000-000000000001','DEMO-PAY-0006-OK',35,40),
        ('DEMO-0008','TRANSFER_SIMULATED','COMPLETED','d0e00008-0000-4000-8000-000000000001','DEMO-PAY-0008-OK',35,40);
    INSERT INTO dbo.payments(
        order_id,quote_id,amount,method,status,request_key,paid_at,reference_code,recorded_by,created_at
    )
    SELECT o.order_id,q.quote_id,q.total_amount,s.method,s.status,s.request_key,
           DATEADD(MINUTE,s.paid_minute,o.pickup_start),s.reference_code,o.collector_id,
           DATEADD(MINUTE,s.created_minute,o.pickup_start)
    FROM @Payments s JOIN dbo.collection_orders o ON o.code=s.code
    JOIN dbo.order_quotes q ON q.order_id=o.order_id AND q.status='ACCEPTED'
    WHERE NOT EXISTS (SELECT 1 FROM dbo.payments p WHERE p.request_key=s.request_key);

    INSERT INTO dbo.disputes(
        order_id,opened_by,reason,previous_order_status,status,created_at
    )
    SELECT o.order_id,o.seller_user_id,N'[DEMO] Khách yêu cầu đối chiếu khối lượng và số tiền.',
           'COMPLETED','IN_REVIEW',DATEADD(MINUTE,90,o.pickup_start)
    FROM dbo.collection_orders o
    WHERE o.code='DEMO-0008' AND NOT EXISTS (
        SELECT 1 FROM dbo.disputes d WHERE d.order_id=o.order_id
          AND d.reason=N'[DEMO] Khách yêu cầu đối chiếu khối lượng và số tiền.'
    );

    DECLARE @Changes TABLE(
        code VARCHAR(40),request_type VARCHAR(20),reason NVARCHAR(500),
        old_start DATETIME2(3),old_end DATETIME2(3),new_start DATETIME2(3),new_end DATETIME2(3),
        status VARCHAR(20),created_at DATETIME2(3),processed_at DATETIME2(3)
    );
    INSERT INTO @Changes
    SELECT 'DEMO-0002','RESCHEDULE',N'[DEMO] Xin chuyển lịch sang ngày tiếp theo.',
           pickup_start,pickup_end,DATEADD(DAY,1,pickup_start),DATEADD(DAY,1,pickup_end),
           'PENDING',DATEADD(MINUTE,-30,@AnchorUtc),NULL
    FROM dbo.collection_orders WHERE code='DEMO-0002';
    INSERT INTO @Changes
    SELECT 'DEMO-0003','RESCHEDULE',N'[DEMO] Khách xin dời lịch hai giờ, đại lý đã duyệt.',
           DATEADD(HOUR,-2,pickup_start),DATEADD(HOUR,-2,pickup_end),pickup_start,pickup_end,
           'APPROVED',DATEADD(HOUR,-2,@AnchorUtc),DATEADD(HOUR,-1,@AnchorUtc)
    FROM dbo.collection_orders WHERE code='DEMO-0003';
    INSERT INTO @Changes
    SELECT 'DEMO-0007','CANCEL',N'[DEMO] Khách không còn nhu cầu thu gom.',
           pickup_start,pickup_end,NULL,NULL,'APPROVED',
           DATEADD(MINUTE,20,created_at),cancelled_at
    FROM dbo.collection_orders WHERE code='DEMO-0007';
    INSERT INTO dbo.order_change_requests(
        order_id,requested_by,request_type,reason,old_pickup_start,old_pickup_end,
        new_pickup_start,new_pickup_end,status,processed_by,processed_at,response_note,version,created_at
    )
    SELECT o.order_id,o.seller_user_id,s.request_type,s.reason,s.old_start,s.old_end,s.new_start,s.new_end,
           s.status,CASE WHEN s.status<>'PENDING' THEN @Admin END,s.processed_at,
           CASE WHEN s.status<>'PENDING' THEN N'[DEMO] Đại lý đã xử lý yêu cầu.' END,
           CASE WHEN s.status='PENDING' THEN 0 ELSE 1 END,s.created_at
    FROM @Changes s JOIN dbo.collection_orders o ON o.code=s.code
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.order_change_requests r
        WHERE r.order_id=o.order_id AND r.request_type=s.request_type AND r.reason=s.reason
    );

    DECLARE @Logs TABLE(
        order_id BIGINT,old_status VARCHAR(30),new_status VARCHAR(30),changed_by BIGINT,
        old_collector BIGINT,new_collector BIGINT,reason NVARCHAR(500),changed_at DATETIME2(3)
    );
    INSERT INTO @Logs
    SELECT o.order_id,e.old_status,e.new_status,
           CASE WHEN e.stage IN (0,6,8) THEN o.seller_user_id
                WHEN e.stage IN (1,2) THEN @Admin ELSE o.collector_id END,
           CASE WHEN e.stage>=3 THEN o.collector_id END,
           CASE WHEN e.stage>=2 THEN o.collector_id END,
           N'[DEMO] Chuyển trạng thái theo luồng thu mua.',
           CASE e.stage
               WHEN 0 THEN s.created_at
               WHEN 1 THEN DATEADD(MINUTE,10,s.created_at)
               WHEN 2 THEN DATEADD(MINUTE,20,s.created_at)
               WHEN 3 THEN DATEADD(MINUTE,-20,s.pickup_start)
               WHEN 4 THEN s.pickup_start
               WHEN 5 THEN DATEADD(MINUTE,CASE WHEN s.code='DEMO-0004' THEN 11 ELSE 20 END,s.pickup_start)
               WHEN 6 THEN DATEADD(MINUTE,30,s.pickup_start)
               WHEN 7 THEN DATEADD(MINUTE,45,s.pickup_start)
               WHEN 8 THEN DATEADD(MINUTE,90,s.pickup_start)
           END
    FROM @Orders s JOIN dbo.collection_orders o ON o.code=s.code
    CROSS JOIN (VALUES
        (0,CAST(NULL AS VARCHAR(30)),CAST('PENDING' AS VARCHAR(30))),
        (1,'PENDING','CONFIRMED'),(2,'CONFIRMED','ASSIGNED'),(3,'ASSIGNED','EN_ROUTE'),
        (4,'EN_ROUTE','ARRIVED'),(5,'ARRIVED','AWAITING_SELLER_APPROVAL'),
        (6,'AWAITING_SELLER_APPROVAL','AWAITING_PAYMENT'),(7,'AWAITING_PAYMENT','COMPLETED'),
        (8,'COMPLETED','DISPUTED')
    ) e(stage,old_status,new_status)
    WHERE e.stage<=s.last_stage AND (s.status<>'CANCELLED' OR e.stage<=1);
    INSERT INTO @Logs
    SELECT order_id,'CONFIRMED','CANCELLED',@Admin,NULL,NULL,
           N'[DEMO] Duyệt yêu cầu hủy của khách.',cancelled_at
    FROM dbo.collection_orders WHERE code='DEMO-0007';
    INSERT INTO @Logs
    SELECT order_id,'ASSIGNED','ASSIGNED',@Admin,collector_id,collector_id,
           N'[DEMO] Duyệt đổi lịch, giữ nguyên nhân viên.',DATEADD(HOUR,-1,@AnchorUtc)
    FROM dbo.collection_orders WHERE code='DEMO-0003';
    INSERT INTO @Logs
    SELECT order_id,'AWAITING_SELLER_APPROVAL','AWAITING_SELLER_APPROVAL',collector_id,collector_id,collector_id,
           N'[DEMO] Gửi báo giá phiên bản 2 sau khi cân lại.',DATEADD(MINUTE,20,pickup_start)
    FROM dbo.collection_orders WHERE code='DEMO-0004';
    INSERT INTO dbo.order_status_logs(
        order_id,old_status,new_status,changed_by,old_collector_id,new_collector_id,reason,changed_at
    )
    SELECT s.order_id,s.old_status,s.new_status,s.changed_by,s.old_collector,s.new_collector,s.reason,s.changed_at
    FROM @Logs s
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.order_status_logs l WHERE l.order_id=s.order_id
          AND l.new_status=s.new_status AND l.changed_at=s.changed_at AND l.reason=s.reason
    );

    IF @OwnTransaction=1 COMMIT TRANSACTION;
    PRINT N'Đã bổ sung dữ liệu mẫu EcoThuGom. Các giá và giao dịch đều là giả định.';
    SELECT code,status,pickup_start,pickup_end FROM dbo.collection_orders
    WHERE code IN ('DEMO-0001','DEMO-0002','DEMO-0003','DEMO-0004',
                   'DEMO-0005','DEMO-0006','DEMO-0007','DEMO-0008')
    ORDER BY code;
END TRY
BEGIN CATCH
    IF XACT_STATE()=-1 ROLLBACK TRANSACTION;
    ELSE IF XACT_STATE()=1
    BEGIN
        IF @OwnTransaction=1 ROLLBACK TRANSACTION;
        ELSE ROLLBACK TRANSACTION EcoDemoSeed;
    END;
    THROW;
END CATCH;
GO
