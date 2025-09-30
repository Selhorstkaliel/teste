import assert from 'assert/strict';
import { validateCPF, validateCNPJ, maskCPFOrCNPJ, normalizeDoc } from '../js/utils/cpfCnpj.js';
import { getEffectiveDiscount } from '../js/services/discounts.js';
import { generateContractPDF } from '../js/utils/pdf.js';

const validCPF = '529.982.247-25';
const invalidCPF = '111.111.111-11';
const validCNPJ = '04.252.011/0001-10';
const invalidCNPJ = '00.000.000/0000-00';

assert.equal(validateCPF(validCPF), true, 'CPF válido deve ser aceito');
assert.equal(validateCPF(invalidCPF), false, 'CPF inválido deve ser rejeitado');
assert.equal(validateCNPJ(validCNPJ), true, 'CNPJ válido deve ser aceito');
assert.equal(validateCNPJ(invalidCNPJ), false, 'CNPJ inválido deve ser rejeitado');

const masked = maskCPFOrCNPJ('52998224725');
assert.equal(masked, validCPF, 'Máscara CPF deve formatar corretamente');
assert.equal(normalizeDoc(masked), '52998224725', 'Normalizar deve remover pontuação');

const admin = { role: 'admin' };
const rep = { role: 'representante' };
const vendedor = { role: 'vendedor' };
assert.equal(getEffectiveDiscount(admin, 120, {}), 120);
assert.equal(getEffectiveDiscount(rep, 0, { representative: { defaultDiscount: 85 } }), 85);
assert.equal(getEffectiveDiscount(vendedor, 0, { seller: { sellerDiscount: 60 } }), 60);

const pdfBlob = generateContractPDF({
  nome: 'Cliente Teste',
  doc: validCPF,
  email: 'cliente@example.com',
  tipo: 'limpeza',
  valor: 'R$ 100,00',
  desconto: 'R$ 10,00',
  liquido: 'R$ 90,00',
  local: 'São Paulo',
  data: '01/01/2025',
  assinatura: 'Cliente Teste',
});
assert.equal(pdfBlob.type, 'application/pdf', 'PDF deve ter mimetype correto');

console.log('Unit tests passed');
