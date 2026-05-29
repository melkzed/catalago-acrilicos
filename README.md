# Recife Acrílicos — Catálogo Digital

Catálogo online profissional da **Recife Acrílicos**, desenvolvido como site estático multi-página. O objetivo é apresentar produtos agrupados por categoria, exibir variações de espessura, medida e acabamento em um modal interativo, e encaminhar o pedido de orçamento diretamente pelo WhatsApp — sem exibir preços.

---

## Demonstração

| Página | Descrição |
|---|---|
| `index.html` | Home com hero, categorias, contatos e footer |
| `pages/produtos.html` | Catálogo com sidebar de filtros e grid de produtos |
| `pages/sobre.html` | Sobre a empresa, missão, valores e contato |

---

## Estrutura de pastas

```text
catalago acrilicos/
├── index.html                      # Página inicial
├── pages/
│   ├── produtos.html               # Catálogo de produtos
│   └── sobre.html                  # Sobre a empresa
├── assets/
│   ├── css/
│   │   └── styles.css              # Todos os estilos customizados
│   ├── img/
│   │   ├── favicon.svg             # Ícone da aba do navegador
│   │   ├── hero-acrilicos.png      # Imagem de fundo do hero
│   │   └── products/               # Fotos dos grupos de produtos
│   │       ├── acrilico-cristal.jpg
│   │       ├── acrilico-leitoso.jpg
│   │       ├── acrilico-preto.jpg
│   │       ├── acrilico-colorido.jpg
│   │       ├── acrilico-espelhado.jpg
│   │       ├── acrilicos-especiais.jpg
│   │       ├── pvc-expandido.jpg
│   │       └── acessorios-complementos.jpg
│   └── js/
│       ├── app.js                  # Ponto de entrada — inicializa todos os módulos
│       ├── animations.js           # Animações via GSAP (fade-up, modal, cards)
│       ├── cart.js                 # Carrinho de orçamento com persistência em localStorage
│       ├── catalog.js              # Catálogo: filtros, cards, modal de variações
│       ├── ui.js                   # Utilitários: escapeHtml, toast, normalizeText, openWhatsApp
│       └── data/
│           └── products.js         # Fonte de dados: grupos de produtos e variações
└── README.md
```

---

## Tecnologias utilizadas

| Tecnologia | Uso |
|---|---|
| **HTML5** | Estrutura semântica das três páginas |
| **CSS3** | Estilos globais em `assets/css/styles.css` |
| **Tailwind CSS** (CDN) | Classes utilitárias de layout e espaçamento |
| **JavaScript ES Modules** | Código modular sem bundler |
| **GSAP** (CDN) | Animações de entrada (`fade-up`), cards e modal |
| **localStorage** | Persistência do carrinho entre sessões |
| **WhatsApp API** | Canal de envio do orçamento (`wa.me`) |

---

## Como rodar localmente

O projeto usa ES Modules (`type="module"`), que **não funcionam via `file://`**. É necessário um servidor HTTP local.

### Opção 1 — Python (sem dependências)

```bash
# Na pasta raiz do projeto:
python -m http.server 5500
```

Acesse: [http://localhost:5500](http://localhost:5500)

### Opção 2 — Node.js com `serve`

```bash
npx serve .
```

### Opção 3 — VS Code Live Server

Instale a extensão **Live Server** e clique em "Go Live" na barra inferior.

---

## Arquitetura do JavaScript

O projeto é dividido em módulos independentes, todos importados pelo `app.js`:

```js
// app.js
import { runInitialAnimations } from "./animations.js";
import { initCart }             from "./cart.js";
import { initCatalogPage, initHomeCategories } from "./catalog.js";

document.addEventListener("DOMContentLoaded", () => {
  initCart();
  initHomeCategories();
  initCatalogPage();
  runInitialAnimations();
});
```

### `data/products.js`
Fonte única de verdade do catálogo. Exporta:
- `WHATSAPP` — número de destino dos orçamentos
- `TAG_STYLES` — cores das etiquetas por tipo de produto
- `CATEGORY_META` — ícone e descrição de cada categoria
- `productGroups` — array com os 8 grupos de produtos e suas variações

### `catalog.js`
Responsável por:
- Renderizar os cards de categoria na home (`initHomeCategories`)
- Construir os filtros da sidebar (categoria, tipo, origem)
- Filtrar produtos por busca textual normalizada (sem acento)
- Abrir e fechar o modal de produto com animação GSAP
- Renderizar botões de variação e specs da variação selecionada
- Enviar produto direto ao WhatsApp ou adicionar ao carrinho

### `cart.js`
Responsável por:
- Injetar o drawer de carrinho no DOM (`ensureCartMarkup`)
- Carregar e salvar o carrinho em `localStorage`
- Controlar abertura/fechamento do drawer
- Atualizar quantidades e remover itens
- Gerar a mensagem estruturada e enviá-la ao WhatsApp

### `animations.js`
- `runInitialAnimations()` — anima elementos `[data-animate="fade-up"]` na carga da página
- `animateCards(selector)` — anima o grid de cards ao filtrar
- `animateModalOpen(panel)` / `animateModalClose(panel, cb)` — transição do modal
- Respeita `prefers-reduced-motion`: desativa todas as animações se o usuário preferir

### `ui.js`
Funções utilitárias puras:
- `escapeHtml(value)` — sanitiza strings antes de inserir no DOM
- `normalizeText(value)` — remove acentos e normaliza para busca
- `showToast(message)` — exibe notificação temporária no canto da tela
- `openWhatsApp(phone, message)` — abre o link `wa.me` em nova aba

---

## Como atualizar o catálogo

Todos os produtos estão em **`assets/js/data/products.js`**. O catálogo, filtros, modal e orçamento são gerados automaticamente a partir desse arquivo — não é necessário editar HTML.

### Estrutura de um grupo de produtos

```js
{
  id: "g1",                              // ID único do grupo
  cat: "Chapas de Acrílico Cristal",     // Categoria (usada nos filtros)
  tipo: "Cristal",                       // Tipo (usado na etiqueta colorida)
  nome: "Acrílico Cristal Transparente", // Nome exibido no card e no modal
  desc: "Descrição curta do produto.",   // Texto do card
  cor: "Cristal (Transparente)",         // Cor padrão do grupo
  image: "acrilico-cristal.jpg",         // Arquivo em assets/img/products/
  variants: [
    {
      label: "2,0 mm",                   // Texto do botão de variação
      medida: "2,00 × 1,00 m",          // Medida da chapa
      esp: "2,0 mm",                     // Espessura
      origem: "",                        // "Importado", "Reciclado" ou ""
      cor: "",                           // Sobrescreve a cor do grupo (opcional)
      subtype: "",                       // Subtipo exibido nas specs (opcional)
      obs: "",                           // Observação exibida nas specs (opcional)
    },
    // ... outras variações
  ],
}
```

### Adicionar um novo produto

1. Abra `assets/js/data/products.js`
2. Adicione um novo objeto ao array `productGroups` seguindo a estrutura acima
3. Coloque a imagem em `assets/img/products/` e referencie no campo `image`
4. Salve — o catálogo atualiza automaticamente ao recarregar a página

### Adicionar uma variação a um produto existente

1. Encontre o grupo desejado pelo campo `id` ou `nome`
2. Insira um novo objeto no array `variants` do grupo
3. Salve — o modal e os filtros atualizam automaticamente

### Trocar a imagem de um produto

1. Coloque o novo arquivo em `assets/img/products/`
2. Atualize o campo `image` do grupo correspondente em `products.js`

### Alterar o número do WhatsApp

Edite a constante no topo de `assets/js/data/products.js`:

```js
export const WHATSAPP = "5581984749394"; // Formato: código do país + DDD + número
```

---

## Fluxo do orçamento

1. **Cliente acessa** a página de produtos
2. **Filtra ou busca** por categoria, tipo, origem ou texto livre
3. **Clica em um card** → modal abre com lista de variações
4. **Seleciona a variação** desejada (espessura, medida, cor)
5. **Define quantidade** e adiciona uma observação (opcional)
6. Pode **adicionar ao carrinho** ou **enviar direto ao WhatsApp**
7. No carrinho, pode montar um pedido com **múltiplos produtos**
8. Ao enviar, o WhatsApp abre com uma **mensagem estruturada** contendo todos os itens

### Formato da mensagem gerada

```
Olá! Gostaria de solicitar um orçamento dos seguintes produtos:

Produto 1:
Nome: Acrílico Cristal Transparente - 3,0 mm Importado
Categoria: Chapas de Acrílico Cristal
Medida: 2,00 × 1,00 m
Espessura: 3,0 mm
Acabamento/Cor: Cristal (Transparente)
Origem: Importado
Quantidade: 2

Produto 2:
Nome: Acrílico Espelhado - Prata
Categoria: Acrílico Espelhado
Medida: 2,00 × 1,00 m
Espessura: 2,0 mm
Acabamento/Cor: Prata
Quantidade: 1

Aguardo o retorno com valores e disponibilidade.
```

---

## Categorias disponíveis

| # | Categoria | Tipo | Variações |
|---|---|---|---|
| 1 | Chapas de Acrílico Cristal | Cristal | 21 |
| 2 | Acrílico Leitoso | Leitoso | 15 |
| 3 | Acrílico Preto | Preto | 9 |
| 4 | Acrílico Colorido | Colorido | 2 |
| 5 | Acrílico Espelhado | Espelhado | 9 |
| 6 | Acrílicos Especiais | Especial | 5 |
| 7 | PVC Expandido Leitoso | PVC | 5 |
| 8 | Acessórios e Complementos | Acessório | 13 |

**Total: 79 variações em 8 grupos de produtos.**

---

## Informações da empresa

| Campo | Valor |
|---|---|
| **Nome** | Recife Acrílicos |
| **WhatsApp** | (81) 98474-9394 |
| **Instagram** | @recifeacrilicosealuminios_ |
| **Endereço** | Rua do Peixoto, 314 — Recife/PE |
| **Horário** | Seg–Sex: 8h às 17h \| Sáb: 8h às 12h |

> O catálogo **não exibe preços**. Não são realizados cortes sob medida nem entregas. Disponível chapas inteiras e corte ao meio.

---

## Deploy

Por ser um site estático (HTML + CSS + JS sem build), pode ser hospedado em qualquer serviço de arquivos estáticos:

- **GitHub Pages** — gratuito, direto do repositório
- **Netlify / Vercel** — arraste a pasta ou conecte o repositório
- **cPanel / Hostgator** — faça upload dos arquivos via FTP para `public_html`

> Não é necessário Node.js, PHP ou banco de dados em produção.

---

## Desenvolvido por

**Melk Zedek Soluções Tech**