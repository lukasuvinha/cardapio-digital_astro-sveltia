// Modo DEMONSTRACAO do template (loja ficticia "Doceria Exemplo" publicada
// como vitrine, por exemplo embutida num iframe na pagina de vendas).
//
// Liga com a variavel de BUILD `PUBLIC_DEMO_MODE=true` — so no projeto da
// Cloudflare da demo (Settings -> Variables and Secrets -> Build). Sem ela,
// o template se comporta exatamente como sempre.
//
// Com o modo ligado:
//  - o cardapio mostra a faixa "Loja de demonstração · os pedidos não são
//    enviados" (src/components/DemoBanner.astro);
//  - "Enviar pedido pelo WhatsApp" NAO abre o wa.me: mostra a mensagem que a
//    loja receberia (etapa "demo" do carrinho, src/components/CartDrawer.astro);
//  - o build gera o painel /admin sem login, com o Test Backend do Sveltia e o
//    conteudo de exemplo (scripts/demo-admin.mjs).
//
// E uma funcao (e nao uma constante) para os testes poderem ligar/desligar a
// variavel com vi.stubEnv. No navegador, o Vite troca
// import.meta.env.PUBLIC_DEMO_MODE pelo valor do build.
export function demoAtivo(env: Record<string, unknown> = import.meta.env): boolean {
  return env.PUBLIC_DEMO_MODE === 'true';
}
