# Vaultfy → UP Store reference audit (work in progress)

Reference archive inspected: `UP-Store(2).zip` (HTTrack; visual reference, not a native Twig theme).
Target repository: `moelmir19/Vaultfy-Theme.` (the trailing dot is part of its actual GitHub repository name).
Target platform: Twsaa custom Twig theme (Twig 3; `getFunction(...)`, platform-provided `homeContent`, platform routes).
Branch: `up-store-vaultfy-rebuild`. The default `main` branch is untouched.

## Source coverage

The archived reference includes one UP homepage, category HTML pages, testimonials and CMS/legal pages.
It also includes the public `themes/angle/assets/css/app.min78a5.css` bundle, front fonts,
some `admin-themes/mbotiq` JavaScript libraries, category images, and one promotional hero image.
**It does not contain an actual product detail, cart, checkout or signed-in account page.**
Consequently, no exact reference comparison for these pages is possible from this ZIP alone.
Duplicated category HTML and HTTrack cache/log/cookies are deliberately excluded from the theme.

## Component mapping

| UP reference | Vaultfy destination | Implementation |
| --- | --- | --- |
| Centered `mainnav` logo and action groups | `views/layout/header.twig` | Re-themed with scoped header CSS; login/cart functions preserved. |
| `s-block--fixed-banner` | `views/home/index.twig`, `custom/bold-banner.twig` | Original `homeContent` banner image/link are used. |
| `s-block--banners .banner-square` | Homepage `.vf-up-category-grid` | Three columns desktop, two mobile, cards hydrate from native `/category` endpoint. |
| Category images and captions | `homeContent.list_of_items` | Merchant-admin-provided photos when link matches native category; otherwise metallic fallback tile. |
| Reference `s-block-9` features | `custom/store-features.twig` | Merchant-controlled feature items preserved. |
| Reference `s-block-10` testimonials | `custom/customer-options.twig` | Merchant-controlled reviews preserved. |
| Category/product listing style | `views/products/category.twig`, `views/products/list/card.twig` | Responsive dark surface styling; native price/cart markup unchanged. |
| Footer navigation/social/contact | `views/layout/footer.twig` | Platform channel/company links retained, UP identity not copied. |

## Platform integration findings

- Twig entry: `views/layout/main.twig`, using `getFunction('assets')`, `getFunction('locale')` and `getFunction('getCurrentChannel')`.
- Product cards render `product.html_price | raw`; this is a native **price output**, not a static number.
- Product form uses `route('cart.add', product.product_id)`; listing-cart AJAX uses `route('cart.addition', '')`.
- The existing category navbar obtains HTML from `/category`; the new cards reuse this **observed** platform endpoint, not an assumed new API.
- The preview extension's `getCategories()` currently returns HTML anchor links without category image URLs. Real category **images therefore require a verified platform API** or merchant-configured list-of-items images; they must not be invented.

## Design choices and known limitations

- Keep the UP reference's **image-first, square category tiles, wide hero, centered header** layout.
- Apply Vaultfy's understated charcoal/silver palette via a separate stylesheet, rather than importing the competitor's CSS/assets.
- Maintain the live platform-controlled product, login, cart, currency and checkout behavior; do not replace it with fake data.
- The supplied Vaultfy logo still needs to be committed as a proper binary asset and used by the header; the existing header continues to use the channel's `channel.logo` configured in Twsaa.
- Reference theme contains product/cart visual components but the saved ZIP **does not**. Their CSS appearance here is provisional.
- Unit/contract checks in GitHub Actions cannot prove runtime behavior. Production smoke testing must cover category clicks, choices, live prices, cart quantity/coupon, payments and login before merging.
- Visual screenshots at 320, 375, 390, 430, 768, 1024, 1440 and 1920px are pending; no claim of pixel-perfect validation is made.
- The original home page included platform-configured product blocks via `/fetch-home-products`; those are intentionally not shown on the rebuilt homepage because this reference homepage primarily exposes category cards. Product listings remain in their native category views. Revisit this if the merchant needs home product blocks.

## Release gate

This PR must remain in **draft** until the actual storefront is previewed, the requested Vaultfy logo
is integrated, the platform feature tests pass, and a real mobile/desktop visual comparison is completed.
