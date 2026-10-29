import { periodLabel, shiftDay } from './reports-period'

const workbookMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const vietnamTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
})
const materialOrder = (a, b) =>
  b.totalAmount - a.totalAmount || a.materialName.localeCompare(b.materialName, 'vi')

function safeFileName(period, extension) {
  return `VCoi-bao-cao-thu-mua-${period.from}-${shiftDay(period.to, -1)}.${extension}`
}

function download(content, type, filename) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.hidden = true
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function csvEscape(value) {
  let text = String(value ?? '')
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

function csvRow(values) {
  return values.map(csvEscape).join(',')
}

export function exportReportCsv({ period, overview, materials }) {
  const summary = [
    ['VCoi | BÁO CÁO THU MUA'],
    ['Kỳ báo cáo', periodLabel(period)],
    ['Ngày xuất', vietnamTime.format(new Date())],
    [],
    ['TỔNG QUAN', 'GIÁ TRỊ', 'ĐƠN VỊ'],
    ['Đơn tạo trong kỳ', overview.totalOrders, 'đơn'],
    ['Đơn đã từng hoàn tất', overview.completedOrders, 'đơn'],
    ['Tỷ lệ hoàn tất', overview.completionRatePercent, '%'],
    ['Đơn đã thanh toán', overview.paidOrders, 'đơn'],
    ['Khối lượng thu mua', overview.totalWeight, 'kg'],
    ['Tổng tiền thu mua đã chi', overview.totalPaidAmount, 'VND'],
    [],
    ['CHI TIẾT THEO VẬT LIỆU'],
    ['Vật liệu', 'Hạng', 'Đơn đã thanh toán', 'Khối lượng (kg)', 'Tiền thu mua (VND)'],
    ...[...materials]
      .sort(materialOrder)
      .map((row) => [
        row.materialName,
        row.grade || 'Không phân hạng',
        row.paidOrders,
        row.totalWeight,
        row.totalAmount,
      ]),
  ]
  const csv = `\uFEFF${summary.map(csvRow).join('\r\n')}`
  download(csv, 'text/csv;charset=utf-8', safeFileName(period, 'csv'))
}

function xmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function cell(value, style = 0) {
  return { value, style }
}

function columnName(index) {
  let value = index + 1
  let name = ''
  while (value > 0) {
    const remainder = (value - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    value = Math.floor((value - 1) / 26)
  }
  return name
}

function worksheetXml(rows, widths, { freezeRows = 0, merges = [] } = {}) {
  const populated = rows.map((row, rowIndex) => {
    const cells = row
      .map((entry, columnIndex) => {
        if (!entry || entry.value === undefined || entry.value === null || entry.value === '')
          return ''
        const reference = `${columnName(columnIndex)}${rowIndex + 1}`
        const style = entry.style ? ` s="${entry.style}"` : ''
        if (typeof entry.value === 'number' && Number.isFinite(entry.value))
          return `<c r="${reference}"${style}><v>${entry.value}</v></c>`
        return `<c r="${reference}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEscape(entry.value)}</t></is></c>`
      })
      .join('')
    return `<row r="${rowIndex + 1}">${cells}</row>`
  })
  const lastColumn = columnName(Math.max(widths.length - 1, 0))
  const lastRow = Math.max(rows.length, 1)
  const panes = freezeRows
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${freezeRows}" topLeftCell="A${freezeRows + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
  const cols = widths
    .map(
      (width, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
    )
    .join('')
  const mergeXml = merges.length
    ? `<mergeCells count="${merges.length}">${merges.map((range) => `<mergeCell ref="${range}"/>`).join('')}</mergeCells>`
    : ''
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastColumn}${lastRow}"/>${panes}<sheetFormatPr defaultRowHeight="21"/><cols>${cols}</cols><sheetData>${populated.join('')}</sheetData>${mergeXml}<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`
}

function styleXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0;[Red]-#,##0"/><numFmt numFmtId="165" formatCode="#,##0.000;[Red]-#,##0.000"/><numFmt numFmtId="166" formatCode="0.00%"/></numFmts><fonts count="3"><font><sz val="10"/><name val="Aptos"/><color rgb="FF1C2F27"/></font><font><b/><sz val="11"/><name val="Aptos Display"/><color rgb="FFFFFFFF"/></font><font><i/><sz val="10"/><name val="Aptos"/><color rgb="FF587064"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF173F32"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8F0E8"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD5ED82"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFDDE5DC"/></left><right style="thin"><color rgb="FFDDE5DC"/></right><top style="thin"><color rgb="FFDDE5DC"/></top><bottom style="thin"><color rgb="FFDDE5DC"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellStyleXfs><cellXfs count="15"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment vertical="center" horizontal="right"/></xf><xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment vertical="center" horizontal="right"/></xf><xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment vertical="center" horizontal="right"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" horizontal="right"/></xf><xf numFmtId="164" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1" applyBorder="1"><alignment vertical="center" horizontal="right"/></xf><xf numFmtId="165" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1" applyBorder="1"><alignment vertical="center" horizontal="right"/></xf><xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1" applyBorder="1"><alignment vertical="center" horizontal="right"/></xf><xf numFmtId="165" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1" applyBorder="1"><alignment vertical="center" horizontal="right"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
}

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1)
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    table[index] = value >>> 0
  }
  return table
})()

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function zipStore(files) {
  const encoder = new TextEncoder()
  const localParts = []
  const centralParts = []
  let localOffset = 0
  const now = new Date()
  const dosTime =
    (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()
  const writeHeader = (size, build) => {
    const buffer = new ArrayBuffer(size)
    const view = new DataView(buffer)
    build(view)
    return new Uint8Array(buffer)
  }
  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name)
    const data = encoder.encode(content)
    const checksum = crc32(data)
    const localHeader = writeHeader(30, (view) => {
      view.setUint32(0, 0x04034b50, true)
      view.setUint16(4, 20, true)
      view.setUint16(6, 0x0800, true)
      view.setUint16(8, 0, true)
      view.setUint16(10, dosTime, true)
      view.setUint16(12, dosDate, true)
      view.setUint32(14, checksum, true)
      view.setUint32(18, data.length, true)
      view.setUint32(22, data.length, true)
      view.setUint16(26, nameBytes.length, true)
      view.setUint16(28, 0, true)
    })
    localParts.push(localHeader, nameBytes, data)
    const centralHeader = writeHeader(46, (view) => {
      view.setUint32(0, 0x02014b50, true)
      view.setUint16(4, 0x0314, true)
      view.setUint16(6, 20, true)
      view.setUint16(8, 0x0800, true)
      view.setUint16(10, 0, true)
      view.setUint16(12, dosTime, true)
      view.setUint16(14, dosDate, true)
      view.setUint32(16, checksum, true)
      view.setUint32(20, data.length, true)
      view.setUint32(24, data.length, true)
      view.setUint16(28, nameBytes.length, true)
      view.setUint16(30, 0, true)
      view.setUint16(32, 0, true)
      view.setUint16(34, 0, true)
      view.setUint16(36, 0, true)
      view.setUint32(38, 0, true)
      view.setUint32(42, localOffset, true)
    })
    centralParts.push(centralHeader, nameBytes)
    localOffset += localHeader.length + nameBytes.length + data.length
  }
  const centralDirectory = joinBytes(centralParts)
  const end = writeHeader(22, (view) => {
    view.setUint32(0, 0x06054b50, true)
    view.setUint16(4, 0, true)
    view.setUint16(6, 0, true)
    view.setUint16(8, files.length, true)
    view.setUint16(10, files.length, true)
    view.setUint32(12, centralDirectory.length, true)
    view.setUint32(16, localOffset, true)
    view.setUint16(20, 0, true)
  })
  return joinBytes([...localParts, centralDirectory, end])
}

function joinBytes(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0)
  const result = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

function workbookFiles(period, overview, materials) {
  const summary = [
    [cell('VCoi | BÁO CÁO THU MUA', 1)],
    [cell(`Kỳ báo cáo: ${periodLabel(period)}`, 2)],
    [cell(`Múi giờ: Việt Nam (UTC+7) · Xuất lúc: ${vietnamTime.format(new Date())}`, 2)],
    [],
    [cell('CHỈ TIÊU', 3), cell('GIÁ TRỊ', 3), cell('DIỄN GIẢI', 3)],
    [
      cell('Đơn tạo trong kỳ', 8),
      cell(overview.totalOrders, 9),
      cell('Tất cả trạng thái, theo ngày tạo đơn', 4),
    ],
    [
      cell('Đơn đã từng hoàn tất', 8),
      cell(overview.completedOrders, 9),
      cell('Theo ngày tạo đơn', 4),
    ],
    [
      cell('Tỷ lệ hoàn tất', 8),
      cell(overview.completionRatePercent / 100, 7),
      cell('Đơn đã từng hoàn tất / đơn tạo trong kỳ', 4),
    ],
    [cell('Đơn đã thanh toán', 8), cell(overview.paidOrders, 9), cell('Theo ngày thanh toán', 4)],
    [
      cell('Khối lượng thu mua (kg)', 8),
      cell(overview.totalWeight, 11),
      cell('Từ các giao dịch đã thanh toán', 4),
    ],
    [
      cell('Tổng tiền thu mua đã chi (VND)', 8),
      cell(overview.totalPaidAmount, 10),
      cell('Tổng số tiền thanh toán đã hoàn tất', 4),
    ],
    [],
    [cell('CÁCH ĐỌC BÁO CÁO', 3)],
    [
      cell(
        'Đơn và tỷ lệ hoàn tất được tính theo ngày tạo. Khối lượng và tiền thu mua được tính theo ngày thanh toán.',
        4,
      ),
    ],
    [cell('Chi tiết vật liệu giữ nguyên tên và hạng tại thời điểm giao dịch.', 4)],
  ]
  const sortedMaterials = [...materials].sort(materialOrder)
  const materialRows = [
    [cell('VCoi | CHI TIẾT GIAO DỊCH THEO VẬT LIỆU', 1)],
    [cell(`Kỳ báo cáo: ${periodLabel(period)}`, 2)],
    [],
    [
      cell('VẬT LIỆU', 3),
      cell('HẠNG', 3),
      cell('ĐƠN ĐÃ THANH TOÁN', 3),
      cell('KHỐI LƯỢNG (KG)', 3),
      cell('TIỀN THU MUA (VND)', 3),
    ],
    ...sortedMaterials.map((row) => [
      cell(row.materialName, 4),
      cell(row.grade || 'Không phân hạng', 4),
      cell(row.paidOrders, 4),
      cell(row.totalWeight, 6),
      cell(row.totalAmount, 5),
    ]),
    [
      cell('TỔNG CỘNG', 12),
      cell('', 12),
      cell('', 12),
      cell(overview.totalWeight, 14),
      cell(overview.totalPaidAmount, 13),
    ],
  ]
  return [
    [
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    ],
    [
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ],
    [
      'xl/workbook.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Tổng quan" sheetId="1" r:id="rId1"/><sheet name="Chi tiết vật liệu" sheetId="2" r:id="rId2"/></sheets><calcPr calcId="191029"/></workbook>`,
    ],
    [
      'xl/_rels/workbook.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ],
    ['xl/styles.xml', styleXml()],
    [
      'xl/worksheets/sheet1.xml',
      worksheetXml(summary, [32, 20, 52], {
        freezeRows: 5,
        merges: ['A1:C1', 'A2:C2', 'A3:C3', 'A13:C13', 'A14:C14', 'A15:C15'],
      }),
    ],
    [
      'xl/worksheets/sheet2.xml',
      worksheetXml(materialRows, [34, 23, 22, 20, 25], {
        freezeRows: 4,
        merges: ['A1:E1', 'A2:E2'],
      }),
    ],
  ]
}

export function exportReportXlsx({ period, overview, materials }) {
  const file = zipStore(workbookFiles(period, overview, materials))
  download(file, workbookMime, safeFileName(period, 'xlsx'))
}
