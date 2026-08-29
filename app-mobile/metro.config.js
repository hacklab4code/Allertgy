const os = require('os');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// ~190MB di pack icone non referenziati: escludili dal file map di Metro
// (altrimenti watch/crawl e cold start diventano lentissimi).
config.resolver.blockList = [
  /[/\\]assets[/\\]icone([/\\].*)?$/,
  /[/\\]assets[/\\]icone_nobg([/\\].*)?$/,
  /[/\\]assets[/\\]icone_emoji([/\\].*)?$/,
];

// M1/M2: più worker = first bundle più veloce (prima era forzato a 2)
config.maxWorkers = Math.max(4, Math.min(6, os.cpus().length - 1));

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: 16,
});
