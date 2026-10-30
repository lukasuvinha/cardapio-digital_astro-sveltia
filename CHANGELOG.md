# Changelog

Novidades do template de cardápio digital (Astro + Sveltia CMS + Cloudflare Workers).

## [Não lançado] — 2026-10-30

### Novo
- **Banner "Próxima fornada"** no topo do cardápio, configurável pelo painel
  (**Configurações → Próxima Fornada**): liga/desliga geral, data e hora exatas
  ou um aviso genérico "Em preparação". Vem **desligado** por padrão; o arquivo
  `src/content/configuracoes/fornada.json` traz só um exemplo fictício.

### Corrigido
- O painel recusava salvar um cupom com o campo opcional **"Hora"** em branco.
- O painel podia deixar de abrir com o erro *"The `accept` option must be a
  string"*: o campo de foto agora usa `accept` como texto separado por vírgulas.

### Testes e documentação
- Novos testes para o banner (regras e renderização) e guardas no `config.yml`
  para as duas correções acima.
- Documentação atualizada em `docs/CUPONS-E-PEDIDOS.md`,
  `docs/BUGS-E-CORRECOES.md` (itens 8 e 9) e `docs/TESTES.md`.
