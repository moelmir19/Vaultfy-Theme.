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

test('UP reference poster geometry stays portrait with three columns at every viewport', () => {
  const css = read('assets/css/vaultfy-up.css');
  const home = read('views/home/index.twig');
  assert.match(css, /\\.vf-up-category-poster\\s*\\{/);
  assert.match(css, /aspect-ratio:\\s*\\.73\\s*\\/\\s*1/);
  assert.match(css, /\\.vf-up-category-cta\\s*\\{/);
  assert.match(css, /clip-path:\\s*polygon/);
  assert.match(css, /@media\\s*\\(max-width:\\s*767px\\)/);
  assert.match(css, /@media\\s*\\(max-width:\\s*359px\\)/);
  assert.match(css, /grid-template-columns:\\s*repeat\\(3,\\s*minmax\\(0,\\s*1fr\\)\\)/);
  assert.doesNotMatch(css, /grid-template-columns:\\s*repeat\\(2,/);
  assert.match(home, /vf-up-category-cta/);
  assert.match(home, /item\\['image'\\]/);
});

test('native category navigation drives live names and URLs, never fixed product data', () => {
  const js = read('assets/js/vaultfy-up.js');
  assert.match(js, /fetch\\('\\/category'/);
  assert.match(js, /parseCategories\\(body\\)/);
  assert.match(js, /category\\.image/);
  assert.match(js, /savedMedia\\.byPath/);
  assert.match(js, /grid\\.replaceChildren\\(fragment\\)/);
  assert.doesNotMatch(js, /Netflix|Shahid|ChatGPT|OSN/);
  assert.doesNotMatch(js, /vf-up-category-placeholder/);
});

test('Vaultfy header is centered, mobile navigation is toggleable and search stays native', () => {
  const header = read('views/layout/header.twig');
  const css = read('assets/css/vaultfy-up.css');
  const main = read('views/layout/main.twig');
  assert.match(header, /images\\/vaultfy-logo\\.webp/);
  assert.match(header, /vf-menu-toggle/);
  assert.match(header, /vf-search-toggle/);
  assert.match(header, /class="ui search"/);
  assert.match(header, /getFunction\\('cartItemsCount'\\)/);
  assert.match(header, /include 'layout\\/navbar.twig'/);
  assert.match(css, /\\.vf-primary-menu\\.vf-open/);
  assert.match(css, /\\.vf-search-panel\\.vf-search-open/);
  assert.match(main, /js\\/vaultfy-up\\.js/);
  assert.equal(fs.existsSync(path.join(root, 'assets/images/vaultfy-logo.webp')), true);
});
