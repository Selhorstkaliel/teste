const escapePDFText = (text) => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const buildPDF = (lines) => {
  const escapedLines = lines.map((line) => `(${escapePDFText(line)}) Tj`).join('\nT* ');
  const streamContent = `BT\n/F1 14 Tf\n72 780 Td\n${escapedLines}\nET`;
  const offsets = ['0000000000 65535 f \n'];
  let body = '%PDF-1.3\n';

  const pushObject = (content) => {
    const offset = body.length;
    offsets.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
    body += `${content}\n`;
  };

  pushObject('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  pushObject('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj');
  pushObject(
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj'
  );
  pushObject(`4 0 obj << /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`);
  pushObject('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj');

  const xrefOffset = body.length;
  body += `xref\n0 ${offsets.length}\n${offsets.join('')}trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([body], { type: 'application/pdf' });
};

export const generateContractPDF = (payload) => {
  const {
    nome,
    doc,
    email,
    tipo,
    valor,
    desconto,
    liquido,
    local,
    data,
    assinatura,
  } = payload;
  const lines = [
    'Contrato de Prestação de Serviços - LimitClean',
    '',
    `Nome: ${nome}`,
    `Documento: ${doc}`,
    `E-mail: ${email || 'não informado'}`,
    `Tipo de serviço: ${tipo}`,
    `Valor bruto: ${valor}`,
    `Desconto aplicado: ${desconto}`,
    `Valor líquido: ${liquido}`,
    `Local e data: ${local}, ${data}`,
    `Assinatura digital: ${assinatura}`,
    '',
    'Este documento foi gerado automaticamente para fins de demonstração.',
  ];
  return buildPDF(lines);
};
