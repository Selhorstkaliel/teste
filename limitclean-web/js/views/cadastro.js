import { createEntry } from '../services/entries.js';
import { saveFile } from '../services/files.js';
import { getRepresentativeByUser, getSellerByUser } from '../services/users.js';
import { maskCPFOrCNPJ, maskPhone, validateCPFOrCNPJ, normalizeDoc } from '../utils/cpfCnpj.js';
import { parseToNumber, toBRL } from '../utils/money.js';
import { generateContractPDF } from '../utils/pdf.js';
import { getEffectiveDiscount } from '../services/discounts.js';

export const renderCadastro = async ({ container, session }) => {
  const user = session?.user;
  const representative = user ? await getRepresentativeByUser(user.id) : null;
  const seller = user ? await getSellerByUser(user.id) : null;
  const effectiveDiscount = getEffectiveDiscount(user, 0, { representative, seller });

  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `
    <h1>Cadastro de Entrada</h1>
    <p class="text-muted">Registre pedidos de limpeza ou rating com validação local de CPF/CNPJ.</p>
    <form class="form-grid" id="entry-form">
      <div class="form-grid form-grid--two">
        <label class="label">
          Tipo de serviço
          <select class="select" name="tipo" required>
            <option value="limpeza">Limpeza</option>
            <option value="rating">Rating PF</option>
            <option value="ratingPJ">Rating PJ</option>
          </select>
        </label>
        <label class="label">
          Documento (CPF/CNPJ)
          <input class="input" name="doc" required maxlength="18" />
        </label>
        <label class="label">
          Nome completo / Razão social
          <input class="input" name="nome" required />
        </label>
        <label class="label">
          Telefone
          <input class="input" name="telefone" required maxlength="16" />
        </label>
        <label class="label">
          Vendedor responsável
          <input class="input" name="vendedor" value="${user?.name || ''}" required />
        </label>
        <label class="label">
          Valor bruto (R$)
          <input class="input" name="valor" required inputmode="decimal" />
        </label>
        <label class="label">
          Desconto aplicado (R$)
          <input class="input" name="desconto" ${user?.role !== 'admin' ? 'readonly' : ''} value="${
    effectiveDiscount || 0
  }" />
        </label>
        <label class="label">
          Valor líquido (R$)
          <input class="input" name="liquido" readonly />
        </label>
        <label class="label" id="feito-field" hidden>
          Rating realizado?
          <select class="select" name="feito">
            <option value="true">Sim</option>
            <option value="false" selected>Não</option>
          </select>
        </label>
      </div>
      <label class="label">
        Anexos (PDF, imagens, até 5 arquivos)
        <input class="input" type="file" name="anexos" multiple accept="image/*,application/pdf" />
      </label>
      <label class="label util-align-center">
        <input type="checkbox" name="termos" required /> Eu aceito os termos do contrato
      </label>
      <button class="button" type="submit">Salvar e gerar contrato</button>
      <p class="alert" role="alert" hidden id="form-error"></p>
      <p class="chip" hidden id="form-success"></p>
    </form>
  `;
  container.append(section);

  const form = section.querySelector('#entry-form');
  const errorBox = form.querySelector('#form-error');
  const successChip = form.querySelector('#form-success');
  const docInput = form.elements.doc;
  const telefoneInput = form.elements.telefone;
  const valorInput = form.elements.valor;
  const descontoInput = form.elements.desconto;
  const liquidoInput = form.elements.liquido;
  const tipoSelect = form.elements.tipo;
  const feitoField = form.querySelector('#feito-field');

  const updateMasks = () => {
    docInput.value = maskCPFOrCNPJ(docInput.value);
    telefoneInput.value = maskPhone(telefoneInput.value);
  };

  const updateLiquido = () => {
    const valor = parseToNumber(valorInput.value);
    const desconto = user?.role === 'admin' ? parseToNumber(descontoInput.value) : effectiveDiscount;
    liquidoInput.value = toBRL(Math.max(0, valor - desconto));
    if (user?.role !== 'admin') {
      descontoInput.value = effectiveDiscount;
    }
  };

  docInput.addEventListener('input', updateMasks);
  telefoneInput.addEventListener('input', updateMasks);
  valorInput.addEventListener('input', updateLiquido);
  descontoInput.addEventListener('input', updateLiquido);
  tipoSelect.addEventListener('change', () => {
    const isRating = tipoSelect.value !== 'limpeza';
    feitoField.hidden = !isRating;
  });

  updateLiquido();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const tipoValue = formData.get('tipo');
    const docValue = formData.get('doc');
    const validDoc = validateCPFOrCNPJ(docValue);
    if (!validDoc) {
      errorBox.textContent = 'Documento inválido. Verifique o CPF/CNPJ informado.';
      errorBox.hidden = false;
      return;
    }
    const valor = parseToNumber(formData.get('valor'));
    const desconto = user?.role === 'admin' ? parseToNumber(formData.get('desconto')) : effectiveDiscount;
    const liquido = Math.max(0, valor - desconto);

    try {
      const entry = await createEntry(
        {
          tipo: tipoValue === 'limpeza' ? 'limpeza' : 'rating',
          doc: normalizeDoc(docValue),
          nome: formData.get('nome'),
          telefone: formData.get('telefone'),
          vendedor: formData.get('vendedor'),
          valor,
          desconto,
          liquido,
          feito: tipoValue !== 'limpeza' ? formData.get('feito') === 'true' : false,
        },
        user
      );

      const pdfBlob = generateContractPDF({
        nome: entry.nome,
        doc: docValue,
        email: user?.email,
        tipo: entry.tipo,
        valor: toBRL(valor),
        desconto: toBRL(desconto),
        liquido: toBRL(liquido),
        local: 'São Paulo - SP',
        data: new Date().toLocaleDateString('pt-BR'),
        assinatura: user?.name || 'LimitClean',
      });

      await saveFile({
        entryId: entry.id,
        name: `contrato-${entry.id}.pdf`,
        mime: 'application/pdf',
        size: pdfBlob.size,
        blob: pdfBlob,
      });

      const anexos = formData.getAll('anexos');
      await Promise.all(
        anexos.map((file) =>
          file && file.size
            ? saveFile({
                entryId: entry.id,
                name: file.name,
                mime: file.type,
                size: file.size,
                blob: file,
              })
            : null
        )
      );

      const downloadUrl = URL.createObjectURL(pdfBlob);
      successChip.innerHTML = `Contrato gerado. <a href="${downloadUrl}" download="contrato-${entry.id}.pdf">Baixar agora</a>`;
      successChip.hidden = false;
      errorBox.hidden = true;
      form.reset();
      feitoField.hidden = true;
      updateLiquido();
    } catch (error) {
      console.error(error);
      errorBox.textContent = 'Erro ao salvar entrada. Tente novamente.';
      errorBox.hidden = false;
    }
  });
};
