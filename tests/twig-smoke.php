<?php
declare(strict_types=1);
require dirname(__DIR__) . '/vendor/autoload.php';

use Twig\Environment;
use Twig\Loader\FilesystemLoader;
use Twig\Source;
use Twig\TwigFilter;
use Twig\TwigFunction;

$root = dirname(__DIR__);
$twig = new Environment(new FilesystemLoader($root . '/views'));
foreach (['getFunction', 'getCompany', 'getConfig', 'getSuperConfig', 'jsonDecode',
          'getDownloadableLinkItem', 'formatPrice', 'trans', 'csrf_token',
          'csrf_field', 'route'] as $name) {
    $twig->addFunction(new TwigFunction($name, static fn(...$args) => null));
}
$twig->addFilter(new TwigFilter('trans', static fn($value) => $value));
$files = [
    'views/layout/main.twig',
    'views/layout/header.twig',
    'views/layout/navbar.twig',
    'views/home/index.twig',
    'views/custom/bold-banner.twig',
    'views/products/list/card.twig',
    'views/products/view.twig',
    'views/products/category.twig',
    'views/checkout/cart/index.twig',
];
foreach ($files as $file) {
    $source = file_get_contents($root . '/' . $file);
    if ($source === false) throw new RuntimeException('Missing template: ' . $file);
    $twig->parse($twig->tokenize(new Source($source, $file)));
    echo "Twig parse OK: $file\n";
}
