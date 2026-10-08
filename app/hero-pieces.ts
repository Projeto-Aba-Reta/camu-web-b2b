export type Piece = {
  /**
   * qual forma desenhar: uma das chaves de PROFILES (hero-scene.ts, metamorfose suave)
   * ou um id de HERO_SHAPES (hero-shapes.ts, a peça é reimpressa)
   */
  shape: string;
  name: string;
  text: string;
  /** cor da peça (hex), também interpolada durante a metamorfose */
  color: string;
  /** cor equivalente no tema claro (o fundo é creme) */
  colorLight: string;
};

export const PIECES: Piece[] = [
  {
    shape: "vaso",
    name: "Vaso exclusivo",
    text: "Curvas que só existem porque a impressora as desenha, camada por camada.",
    color: "#2f9e8e",
    colorLight: "#2f9e8e",
  },
  {
    shape: "trofeu",
    name: "Troféu sob medida",
    text: "Premiação que vai para a estante, não para a gaveta.",
    color: "#f2c14e",
    colorLight: "#d9962b",
  },
  {
    shape: "mascote",
    name: "Mascote da marca",
    text: "O seu personagem ganha corpo e vira peça de coleção.",
    color: "#ff8a5c",
    colorLight: "#ce6a4b",
  },
  {
    shape: "luminaria",
    name: "Luminária escultural",
    text: "Luz, forma e marca juntas em um objeto só.",
    color: "#d9a8ff",
    colorLight: "#8a5fb8",
  },
  {
    shape: "moeda",
    name: "Moeda personalizada",
    text: "Relevo com a sua logo e a do seu cliente, pronta para encher um baú.",
    color: "#ffd45c",
    colorLight: "#c9921a",
  },
  {
    shape: "bau",
    name: "Baú do tesouro",
    text: "Impresso em camadas, com a tampa que abre sozinha para revelar o que vem dentro.",
    color: "#d9a05b",
    colorLight: "#a8672a",
  },
  {
    shape: "foguete",
    name: "Miniatura de lançamento",
    text: "O produto novo vira objeto de estante no dia em que sai.",
    color: "#ff6b6b",
    colorLight: "#c4453f",
  },
  {
    shape: "cracha-nfc",
    name: "Crachá e chaveiro inteligente",
    text: "Um toque e o cliente cai direto na página da sua marca.",
    color: "#5ce1e6",
    colorLight: "#2a8c94",
  },
  {
    shape: "cofrinho",
    name: "Cofrinho de marca",
    text: "Um presente que fica na mesa do cliente e lembra você todo dia.",
    color: "#ff9ec7",
    colorLight: "#c25c8a",
  },
  {
    shape: "engrenagem",
    name: "Peça técnica sob medida",
    text: "Protótipos funcionais, do conceito ao encaixe perfeito.",
    color: "#b8c0cc",
    colorLight: "#5d6673",
  },
  {
    shape: "espiral",
    name: "Espiral da marca",
    text: "A cauda do camaleão da Camu, impressa como assinatura.",
    color: "#7dd87f",
    colorLight: "#3d8f43",
  },
];
