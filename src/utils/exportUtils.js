const EXPORT_HEADERS = [
  'Divisi',
  'Nama Barang',
  'Jumlah Barang',
  'Kategori',
  'Status di Divisi Perlap',
  'Jika Membeli',
  'Jika Menyewa',
  'Jika Meminjam',
  'Catatan Opsional',
  'Tanggal Permintaan',
];

function mapItemToRow(item) {
  return [
    item.divisi,
    item.namaBarang,
    item.jumlahBarang,
    item.kategori,
    item.tersediaDiPerlap || 'Belum Ada',
    item.jikaMembeli,
    item.jikaMenyewa,
    item.jikaMeminjam,
    item.catatanOpsional,
    item.tanggalPermintaan,
  ];
}

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportItemsToExcel(rows, activeDivisiTab = 'ALL') {
  const scopeName =
    activeDivisiTab === 'ALL'
      ? 'Form_Responses_Semua_Divisi'
      : `Rekap_${activeDivisiTab}`;

  const tableHeaderHtml = EXPORT_HEADERS.map(
    (h) =>
      `<th style="background-color:#132956;color:#FFFFFF;font-weight:bold;border:1px solid #0A1936;padding:6px 10px;">${escapeXml(
        h
      )}</th>`
  ).join('');

  const tableRowsHtml = rows
    .map((r) => {
      const cells = mapItemToRow(r)
        .map(
          (val) =>
            `<td style="border:1px solid #111111;padding:5px 10px;">${escapeXml(
              val
            )}</td>`
        )
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>${escapeXml(scopeName.slice(0, 31))}</x:Name>
          <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
</head>
<body>
  <table>
    <thead><tr>${tableHeaderHtml}</tr></thead>
    <tbody>${tableRowsHtml}</tbody>
  </table>
</body>
</html>`;

  const blob = new Blob(['\uFEFF' + excelHtml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${scopeName}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportItemsToCsv(rows, activeDivisiTab = 'ALL') {
  const csvLines = [
    EXPORT_HEADERS.join(','),
    ...rows.map((r) =>
      mapItemToRow(r)
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];

  const csvContent = '\uFEFF' + csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const scopeName =
    activeDivisiTab === 'ALL'
      ? 'Form_Responses_Semua_Divisi'
      : `Rekap_${activeDivisiTab}`;

  link.href = url;
  link.download = `${scopeName}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function copyItemsToTsv(rows) {
  const tsv = [
    EXPORT_HEADERS.join('\t'),
    ...rows.map((r) =>
      mapItemToRow(r)
        .map((v) => String(v ?? '').replace(/[\t\r\n]+/g, ' '))
        .join('\t')
    ),
  ].join('\n');

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(tsv);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = tsv;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const success = document.execCommand('copy');
  textarea.remove();

  if (!success) {
    throw new Error('Clipboard copy failed');
  }
  return true;
}

export function filterItems(
  items,
  {
    activeDivisiTab = 'ALL',
    searchQuery = '',
    categoryFilter = 'ALL',
    perlapFilter = 'ALL',
  }
) {
  const query = (searchQuery || '').toLowerCase().trim();

  return items.filter((item) => {
    const statusPerlap = item.tersediaDiPerlap || 'Belum Ada';
    const matchDivisi =
      activeDivisiTab === 'ALL' || item.divisi === activeDivisiTab;
    const matchKat =
      categoryFilter === 'ALL' || item.kategori === categoryFilter;
    const matchPerlap =
      perlapFilter === 'ALL' || statusPerlap === perlapFilter;
    const matchQuery =
      !query ||
      [
        item.divisi,
        item.namaBarang,
        statusPerlap,
        item.jikaMembeli,
        item.jikaMenyewa,
        item.jikaMeminjam,
        item.catatanOpsional,
      ].some((val) => String(val || '').toLowerCase().includes(query));

    return matchDivisi && matchKat && matchPerlap && matchQuery;
  });
}
