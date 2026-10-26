// Postes habituels de chaque champion (clés = id Data Dragon), pour le filtre par rôle
// et l'attribution automatique. Fusionnés avec les rôles réellement joués aux Worlds.
const L = {
  top: 'Aatrox Akali Ambessa Aurora Camille Chogath Darius DrMundo Fiora Gangplank Garen Gnar Gragas Gwen Heimerdinger Illaoi Irelia Jax Jayce Kayle Kennen Kled KSante Malphite Maokai Mordekaiser Nasus Olaf Ornn Pantheon Poppy Quinn Renekton Riven Rumble Ryze Sett Shen Singed Sion Skarner Sylas TahmKench Teemo Trundle Tryndamere Udyr Urgot Vayne Vladimir Volibear Warwick MonkeyKing Yasuo Yone Yorick Zac Cassiopeia Galio Smolder Rengar Zaahen',
  jungle: 'Amumu Belveth Brand Briar Diana Ekko Elise Evelynn Fiddlesticks Gragas Graves Hecarim Ivern JarvanIV Jax Karthus Kayn Khazix Kindred LeeSin Lillia MasterYi Maokai Morgana Naafiri Nidalee Nocturne Nunu Olaf Pantheon Poppy Qiyana Rammus RekSai Rengar Sejuani Shaco Shyvana Skarner Sylas Taliyah Talon Trundle Udyr Vi Viego Volibear Warwick MonkeyKing XinZhao Zac Zed Zyra Ambessa Wukong Zaahen',
  mid: 'Ahri Akali Akshan Anivia Annie AurelionSol Aurora Azir Cassiopeia Corki Diana Ekko Fizz Galio Hwei Irelia Jayce Kassadin Katarina Leblanc Lissandra Lux Malzahar Mel Naafiri Neeko Orianna Qiyana Ryze Sylas Syndra Taliyah Talon TwistedFate Veigar Velkoz Vex Viktor Vladimir Xerath Yasuo Yone Zed Ziggs Zoe Smolder Tristana Lucian Swain Heimerdinger Pantheon Kennen Gragas Locke',
  adc: 'Aphelios Ashe Caitlyn Corki Draven Ezreal Jhin Jinx Kaisa Kalista KogMaw Lucian MissFortune Nilah Samira Senna Sivir Smolder Tristana Twitch Varus Vayne Xayah Zeri Ziggs Seraphine Swain Karthus Yasuo Hwei Mel Yunara',
  support: 'Alistar Bard Blitzcrank Brand Braum Janna Karma Leona Lulu Lux Maokai Milio Morgana Nami Nautilus Neeko Pyke Rakan Rell Renata Senna Seraphine Sona Soraka Swain Taric Thresh Velkoz Xerath Yuumi Zilean Zyra Poppy Shen Camille Galio TahmKench Amumu Pantheon Annie Hwei Elise Mel Leblanc Zoe Sett Ashe',
};
export const CHAMP_POSITIONS = {};
for (const [role, list] of Object.entries(L)) {
  for (const id of list.split(/\s+/)) {
    const arr = (CHAMP_POSITIONS[id] ??= []);
    if (!arr.includes(role)) arr.push(role);
  }
}
