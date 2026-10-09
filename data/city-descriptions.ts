type CityDescription = {
  description: string;
  highlights: string[];
  source: string;
};

// Descriptions originales à partir des guides de l’office national du tourisme japonais
export const cityDescriptions: Record<string, CityDescription> = {
  sapporo: {
    description: "Sur l’île de Hokkaidō, Sapporo fait découvrir un autre visage du Japon, marqué par la neige et les grands espaces. Son festival de la neige transforme la ville en exposition de sculptures de glace et de neige. Le quartier de Susukino et les spécialités locales, comme les ramen et les fruits de mer, font aussi partie de son identité.",
    highlights: ["Festival de la neige", "Quartier de Susukino", "Ramen et produits locaux"],
    source: "https://www.japan.travel/en/destinations/hokkaido/hokkaido/sapporo-and-around/",
  },
  tokyo: {
    description: "Capitale du Japon, Tokyo mêle traditions et culture contemporaine. À Asakusa, les temples et les petites boutiques racontent la ville ancienne. À Shibuya et Harajuku, la mode et la culture urbaine occupent le devant de la scène. Akihabara est un autre repère pour découvrir les jeux vidéo, l’électronique et les univers de l’animation japonaise.",
    highlights: ["Temples d’Asakusa", "Mode à Harajuku", "Culture populaire à Akihabara"],
    source: "https://www.japan.travel/en/destinations/kanto/tokyo/",
  },
  kyoto: {
    description: "Kyoto est un lieu privilégié pour découvrir les traditions japonaises. Ses sanctuaires, ses quartiers anciens et ses machiya, des maisons de ville en bois, témoignent d’une longue histoire culturelle. La culture du thé, l’art floral et le festival Gion Matsuri font vivre ce patrimoine au quotidien, au-delà des monuments.",
    highlights: ["Maisons machiya", "Festival Gion Matsuri", "Culture du thé"],
    source: "https://www.japan.travel/en/destinations/kansai/kyoto/",
  },
  osaka: {
    description: "Osaka est une grande ville du Kansai connue pour sa gastronomie et ses quartiers animés. Les enseignes lumineuses de Dōtonbori donnent un aperçu de son énergie, tandis que son château et son parc invitent à découvrir son histoire. Les restaurants, les marchés et les fêtes locales offrent de nombreuses occasions d’explorer la culture de la ville.",
    highlights: ["Quartier de Dōtonbori", "Château d’Osaka", "Gastronomie locale"],
    source: "https://www.japan.travel/en/destinations/kansai/osaka/",
  },
  hiroshima: {
    description: "Hiroshima est une ville de l’ouest de Honshū, liée à la mémoire et à la paix. Le parc du Mémorial de la Paix et le dôme de la bombe atomique rappellent le bombardement de 1945. La ville possède aussi une culture culinaire reconnue pour l’okonomiyaki. À proximité, l’île de Miyajima abrite le sanctuaire d’Itsukushima et son torii au bord de l’eau.",
    highlights: ["Parc du Mémorial de la Paix", "Okonomiyaki", "Miyajima à proximité"],
    source: "https://www.japan.travel/en/destinations/chugoku/hiroshima/",
  },
  fukuoka: {
    description: "Au nord de Kyūshū, Fukuoka est une ville ouverte sur la mer et les échanges avec l’Asie. Sa culture culinaire se découvre notamment dans les yatai, de petits stands de restauration. Les ramen tonkotsu, préparés avec un bouillon de porc, comptent parmi les spécialités de la région. Le port de Hakata rappelle aussi sa place dans les liaisons maritimes du Japon.",
    highlights: ["Stands yatai", "Ramen tonkotsu", "Port de Hakata"],
    source: "https://www.japan.travel/en/destinations/kyushu/fukuoka/",
  },
};
