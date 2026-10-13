const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('merchant storefront still uses the real Twsaa platform APIs', () => {
  const main = read('views/layout/main.twig');
  const header = read('views/layout/header.twig');
  const product = read('views/products/view.twig');
  const cart = read('views/checkout/cart/index.twig');
  assert.match(main, /getFunction\('assets'\)/);
  assert.match(header, /getFunction\('cartItemsCount'\)/);
  assert.match(product, /route\('cart\.add',\s*product\.product_id\)/);
  assert.match(cart, /cart/);
});

test('home is a dynamic merchant-data page, not a copied UP snapshot', () => {
  const home = read('views/home/index.twig');
  const js = read('assets/js/vaultfy-up.js');
  assert.match(home, /homeContent/);
  assert.match(home, /content\['settings'\]\['image'\]/);
  assert.match(home, /vf-up-category-grid/);
  assert.match(js, /fetch\('\/category'/);
  assert.match(js, /new DOMParser/);
  assert.doesNotMatch(home, /up-store\.net/);
});

test('assets are wired after platform styles and cover mobile breakpoints', () => {
  const layout = read('views/layout/main.twig');
  const styles = read('assets/css/vaultfy-up.css');
  assert.match(layout, /css\/vaultfy-up\.css/);
  assert.match(styles, /max-width: 767px/);
  assert.match(styles, /max-width: 359px/);
  assert.match(styles, /vf-up-category-grid/);
});

test('merchant checkout/cart logic remains in platform templates', () => {
  assert.match(read('views/layout/main.twig'), /route\('cart\.addition',/);
  assert.match(read('views/products/list/card.twig'), /product\.html_price/);
  assert.match(read('views/products/category.twig'), /route\('shop\.productOrCategory\.load',/);
});

test('archived competitor HTML/cookies are not committed', () => {
  assert.equal(fs.existsSync(path.join(root, 'UP-Store')), false);
  assert.equal(fs.existsSync(path.join(root, 'cookies.txt')), false);
  assert.equal(fs.existsSync(path.join(root, 'hts-cache')), false);
});

test('UP reference poster geometry stays portrait with three columns on all screens', () => {
  const css = read('assets/css/vaultfy-up.css');
  const home = read('views/home/index.twig');
  assert.ok(css.includes('.vf-up-category-poster {'));
  assert.ok(css.includes('aspect-ratio: .73 / 1'));
  assert.ok(css.includes('.vf-up-category-cta {'));
  assert.ok(css.includes('clip-path: polygon'));
  assert.ok(css.includes('max-width: 767px'));
  assert.ok(css.includes('max-width: 359px'));
  assert.ok(css.includes('grid-template-columns: repeat(3,minmax(0,1fr))'));
  assert.ok(home.includes('vf-up-category-cta'));
  assert.ok(home.includes("item['image']"));
});

test('native categories use merchant image mapping, no fixed products', () => {
  const js = read('assets/js/vaultfy-up.js');
  assert.ok(js.includes("fetch('/category'"));
  assert.ok(js.includes('parseCategories(body, grid.dataset.storageBase'));
  assert.ok(js.includes('category.image'));
  assert.ok(js.includes('savedMedia.byPath'));
  assert.ok(js.includes('grid.replaceChildren(fragment)'));
  assert.ok(!/Netflix|Shahid|ChatGPT|OSN/.test(js));
  assert.ok(!js.includes('vf-up-category-placeholder'));
});

test('Vaultfy mobile header preserves the official account, cart and search wiring', () => {
  const header = read('views/layout/header.twig');
  const css = read('assets/css/vaultfy-up.css');
  const main = read('views/layout/main.twig');
  assert.ok(header.includes('images/vaultfy-logo.webp'));
  assert.ok(header.includes('vf-menu-toggle'));
  assert.ok(header.includes('vf-search-toggle'));
  assert.ok(header.includes('class="ui search"'));
  assert.ok(header.includes("getFunction('cartItemsCount')"));
  assert.ok(header.includes("include 'layout/navbar.twig'"));
  assert.ok(css.includes('.vf-primary-menu.vf-open'));
  assert.ok(css.includes('.vf-search-panel.vf-search-open'));
  assert.ok(main.includes('js/vaultfy-up.js'));
  assert.equal(fs.existsSync(path.join(root,'assets/images/vaultfy-logo.webp')),true);
});
