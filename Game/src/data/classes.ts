import type { ClassDef } from '../state/types';
export const CLASSES: ClassDef[] = [
  {
    id: 'warrior',
    name: 'Guerreiro',
    primary: 'FOR',
    weapon: 'Espada',
    color: '#d2b47a',
    skills: ['Corte crescente', 'Impacto sísmico', 'Segundo fôlego', 'Fúria de batalha'],
    paths: [
      ['Cavaleiro', 'Paladino', 'Santo da Espada'],
      ['Berserker', 'Campeão', 'Warlord'],
      ['Duelista', 'Mestre Lâmina', 'Espadachim Supremo'],
    ],
  },
  {
    id: 'mage',
    name: 'Mago',
    primary: 'INT',
    weapon: 'Cajado',
    color: '#ad91d5',
    skills: ['Orbe arcano', 'Nova elemental', 'Fonte de mana', 'Tempestade'],
    paths: [
      ['Elementalista', 'Arquimago', 'Sábio dos Elementos'],
      ['Necromante', 'Lich', 'Soberano dos Mortos'],
      ['Runeiro', 'Mestre das Runas', 'Tecelão da Realidade'],
    ],
  },
  {
    id: 'archer',
    name: 'Arqueiro',
    primary: 'DES',
    weapon: 'Arco',
    color: '#8ab88c',
    skills: ['Flecha precisa', 'Chuva de flechas', 'Passo da floresta', 'Disparo mortal'],
    paths: [
      ['Patrulheiro', 'Caçador de Feras', 'Senhor da Caça'],
      ['Atirador', 'Franco-atirador', 'Olho do Céu'],
      ['Arqueiro Arcano', 'Flecha Mágica', 'Arqueiro Estelar'],
    ],
  },
  {
    id: 'assassin',
    name: 'Assassino',
    primary: 'DES',
    weapon: 'Adaga',
    color: '#b191bb',
    skills: ['Lâmina sombria', 'Nuvem venenosa', 'Roubo de vida', 'Execução'],
    paths: [
      ['Ladino', 'Sombra', 'Mestre da Noite'],
      ['Envenenador', 'Alquimista da Morte', 'Rei Veneno'],
      ['Lâmina Fantasma', 'Ceifador', 'Morte Encarnada'],
    ],
  },
  {
    id: 'cleric',
    name: 'Clérigo',
    primary: 'SAB',
    weapon: 'Símbolo',
    color: '#e4d29a',
    skills: ['Luz punitiva', 'Círculo sagrado', 'Prece de cura', 'Julgamento'],
    paths: [
      ['Sacerdote', 'Bispo', 'Santo'],
      ['Inquisidor', 'Julgador', 'Arauto da Ira'],
      ['Druida', 'Guardião da Natureza', 'Voz da Floresta'],
    ],
  },
  {
    id: 'summoner',
    name: 'Invocador',
    primary: 'SAB',
    weapon: 'Tomo',
    color: '#7fc9b8',
    skills: ['Espírito voraz', 'Pacto de espinhos', 'Vínculo vital', 'Hoste espectral'],
    paths: [
      ['Domador', 'Mestre das Feras', 'Rei das Bestas'],
      ['Espiritualista', 'Mestre dos Espíritos', 'Soberano Espiritual'],
      ['Conjurador Pactuado', 'Senhor dos Pactos', 'Lorde dos Pactos'],
    ],
  },
];
export const classById = (id: string) => CLASSES.find((c) => c.id === id) ?? CLASSES[0];
