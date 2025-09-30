# LimitClean Console (SPA)

Aplicação SPA offline-first para gestão de cadastros, contratos e suporte, construída somente com HTML, CSS e JavaScript (ES Modules). Todos os dados são persistidos localmente via IndexedDB.

## Funcionalidades principais

- Autenticação local com hash PBKDF2 (simulação Argon2) e token assinado em memória via WebCrypto.
- Seed automático do usuário administrador `Kaliel / kaskolk14`.
- Dashboard com KPIs, gráficos (renderização canvas inspirada em Chart.js), filtros de período e tabela de últimas entradas.
- Cadastro de Limpeza/Rating com máscaras CPF/CNPJ/Telefone, cálculo de desconto conforme papel e geração de contrato em PDF (Blob).
- Upload de anexos e armazenamento em IndexedDB.
- Scheduler em Web Worker para atualizar status (D0/D30/D180) com botão de sincronização manual.
- Service Worker para cache offline do app shell.
- Área de configuração com RBAC (admin, representante, vendedor) para manutenção de usuários, representantes e vendedores.
- Central de suporte com abertura e listagem de tickets.
- Testes unitários simples (`node tests/unit.spec.mjs`).

### Observações de segurança

Este projeto é didático, sem backend:

- Sessão é armazenada no cliente (memória + localStorage). Não há cookies httpOnly nem proteção real contra XSS/CSRF.
- Hash de senha utiliza PBKDF2 via WebCrypto como aproximação local ao Argon2 devido a restrições de ambiente. Ajustar parâmetros conforme necessidade.
- A assinatura do “JWT” local usa HMAC-SHA256 via WebCrypto, apenas ilustrativo.
- Todas as informações permanecem no navegador via IndexedDB.

## Scripts recomendados

```bash
# Executar testes unitários
node tests/unit.spec.mjs

# Playwright (necessita dependências instaladas)
npx playwright test tests/e2e.spec.js
```

Para rodar com Service Worker é necessário servir a pasta `limitclean-web` em um servidor estático local, por exemplo:

```bash
npx serve limitclean-web
```

Em seguida acesse `http://localhost:3000/index.html`.
