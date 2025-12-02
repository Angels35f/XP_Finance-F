export const achievementsData = [
  // COMUM (Verde)
  { id: 'first_deposit', title: 'Primeiro Depósito', rarity: 'common', desc: 'Realizou o seu primeiro depósito.' },
  { id: 'first_look', title: 'Dando uma Olhada', rarity: 'common', desc: "Visitou a seção 'Passe de Batalha' e 'Conquistas' pela primeira vez." },
  { id: 'positive_week', title: 'Sem Aperto', rarity: 'common', desc: 'Terminou uma semana (7 dias) com o saldo positivo.' },
  { id: 'first_payment', title: 'Mão na Roda', rarity: 'common', desc: 'Realizou o seu primeiro pagamento de boleto pela plataforma.' },
  { id: 'battle_pass_1', title: 'Passe Livre', rarity: 'common', desc: 'Desbloqueou o primeiro nível do Passe de Batalha.' },

  // RARO (Azul)
  { id: 'consistent_saver', title: 'Poupador Consistente', rarity: 'rare', desc: 'Fez depósitos por 3 meses seguidos.' },
  { id: 'thousandaire', title: 'Mil-ionário', rarity: 'rare', desc: 'Atingiu um saldo total de R$ 1.000.' },
  { id: 'bills_on_time', title: 'Contas em Dia', rarity: 'rare', desc: 'Pagou 3 boletos dentro do prazo de vencimento.' },
  { id: 'tight_fist', title: 'Mão Fechada', rarity: 'rare', desc: "Concluiu um desafio de 'Não fazer saques por 5 dias'." },
  { id: 'collector', title: 'Colecionador', rarity: 'rare', desc: 'Desbloqueou 5 recompensas do Passe de Batalha.' },
  { id: 'early_bird', title: 'Poupador Antecipado', rarity: 'rare', desc: 'Fez um depósito nos primeiros 3 dias do mês.' },

  // ÉPICO (Roxo)
  { id: 'economy_master', title: 'Mestre da Economia', rarity: 'epic', desc: 'Atingiu um saldo total de R$ 5.000.' },
  { id: 'impeccable', title: 'Disciplina Impecável', rarity: 'epic', desc: 'Fez depósitos semanais por 6 meses inteiros sem falhar.' },
  { id: 'emergency_fund', title: 'Reserva de Emergência', rarity: 'epic', desc: 'Manteve um valor mínimo de R$ 1.500 intocado na conta por 30 dias.' },
  { id: 'battler', title: 'Batalhador', rarity: 'epic', desc: 'Completou 10 níveis do Passe de Batalha.' },
  { id: 'self_control', title: 'Autocontrole', rarity: 'epic', desc: 'Passou 15 dias consecutivos sem realizar saques.' },

  // LENDÁRIO (Dourado)
  { id: 'ten_k', title: 'Mil dez vezes', rarity: 'legendary', desc: 'Atingiu um saldo total de R$ 10.000.' },
  { id: 'fortress', title: 'Fortaleza Financeira', rarity: 'legendary', desc: "Manteve a 'Reserva de Emergência' intocada por 120 dias." },
  { id: 'pass_master', title: 'Mestre do Passe', rarity: 'legendary', desc: 'Completou todos os níveis do Passe de Batalha de uma temporada.' },
  { id: 'invincible', title: 'Invencível', rarity: 'legendary', desc: 'Passou 60 dias consecutivos sem nunca ficar com o saldo negativo.' },
  { id: 'pioneer', title: 'Pioneiro', rarity: 'legendary', desc: 'Para os primeiros 100 usuários que se cadastraram.' },

  // MÍTICO (Vermelho)
  { id: 'living_legend', title: 'Lenda Viva', rarity: 'mythic', desc: 'Atingiu o nível máximo de XP do usuário.' },
  { id: 'dedication', title: 'Dedicação Suprema', rarity: 'mythic', desc: 'Fez login no aplicativo por 365 dias consecutivos.' },
  { id: 'veteran', title: 'Veterano', rarity: 'mythic', desc: 'Participou de 3 temporadas completas do Passe de Batalha.' },
  { id: 'yacht_time', title: 'Hora do Iate', rarity: 'mythic', desc: 'Atingiu o saldo de R$ 100.000.' },
  { id: 'mythic_coll', title: 'Colecionador Mítico', rarity: 'mythic', desc: "Desbloqueou todas as conquistas 'Épicas' e 'Lendárias'." },
];

export const ACHIEVEMENTS = achievementsData.reduce((m, a) => {
  m[a.id] = a;
  return m;
}, {});