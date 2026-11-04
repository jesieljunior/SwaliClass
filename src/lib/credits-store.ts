// SwaliClass - Educational Credits & Gamification Store
// Gerencia a moeda interna: Créditos do Plano (expiram), Contribuição (permanentes) e Comprados (permanentes).
// Ordem de gasto prioritária: Plano -> Contribuição -> Comprados.

export interface CreditBalances {
  planCredits: number; // Renova mensalmente, expira no fim do ciclo
  contributionCredits: number; // Conquistado enviando materiais ou ajudando na comunidade
  purchasedCredits: number; // Comprados em pacotes avulsos
  total: number;
}

export interface CreditTransaction {
  id: string;
  type: "earned" | "spent" | "recharge";
  category: "plan" | "contribution" | "purchased";
  amount: number;
  description: string;
  date: string;
}

export interface StudyStreak {
  currentDays: number;
  longestDays: number;
  lastStudyDate: string;
  activeToday: boolean;
}

const STORAGE_KEY_CREDITS = "swaliclass_credits_v1";
const STORAGE_KEY_HISTORY = "swaliclass_credits_history_v1";
const STORAGE_KEY_STREAK = "swaliclass_streak_v1";

const INITIAL_CREDITS: CreditBalances = {
  planCredits: 50,
  contributionCredits: 25,
  purchasedCredits: 0,
  total: 75,
};

const INITIAL_HISTORY: CreditTransaction[] = [
  {
    id: "tx-1",
    type: "recharge",
    category: "plan",
    amount: 50,
    description: "Renovação mensal do plano institucional",
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "tx-2",
    type: "earned",
    category: "contribution",
    amount: 25,
    description: "Recompensa por envio de resumo na Biblioteca Colaborativa",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const INITIAL_STREAK: StudyStreak = {
  currentDays: 5,
  longestDays: 14,
  lastStudyDate: new Date().toISOString(),
  activeToday: true,
};

export const creditsStore = {
  getBalances(): CreditBalances {
    if (typeof window === "undefined") return INITIAL_CREDITS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CREDITS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_CREDITS, JSON.stringify(INITIAL_CREDITS));
        return INITIAL_CREDITS;
      }
      const parsed = JSON.parse(stored);
      parsed.total =
        (parsed.planCredits || 0) +
        (parsed.contributionCredits || 0) +
        (parsed.purchasedCredits || 0);
      return parsed;
    } catch {
      return INITIAL_CREDITS;
    }
  },

  getHistory(): CreditTransaction[] {
    if (typeof window === "undefined") return INITIAL_HISTORY;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(INITIAL_HISTORY));
        return INITIAL_HISTORY;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_HISTORY;
    }
  },

  getStreak(): StudyStreak {
    if (typeof window === "undefined") return INITIAL_STREAK;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STREAK);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_STREAK, JSON.stringify(INITIAL_STREAK));
        return INITIAL_STREAK;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_STREAK;
    }
  },

  /**
   * Consome créditos seguindo estritamente a ordem de negócio:
   * 1. Créditos do Plano (expiram no fim do mês)
   * 2. Créditos por Contribuição (permanentes)
   * 3. Créditos Comprados (permanentes)
   */
  spendCredits(amount: number, description: string): boolean {
    const balances = this.getBalances();
    if (balances.total < amount) {
      return false;
    }

    let remaining = amount;
    let spentCategory: "plan" | "contribution" | "purchased" = "plan";

    // 1. Tenta gastar do plano
    if (balances.planCredits >= remaining) {
      balances.planCredits -= remaining;
      remaining = 0;
      spentCategory = "plan";
    } else {
      remaining -= balances.planCredits;
      balances.planCredits = 0;

      // 2. Tenta gastar de contribuição
      if (balances.contributionCredits >= remaining) {
        balances.contributionCredits -= remaining;
        remaining = 0;
        spentCategory = "contribution";
      } else {
        remaining -= balances.contributionCredits;
        balances.contributionCredits = 0;

        // 3. Gasta dos comprados
        balances.purchasedCredits = Math.max(0, balances.purchasedCredits - remaining);
        spentCategory = "purchased";
      }
    }

    balances.total =
      balances.planCredits + balances.contributionCredits + balances.purchasedCredits;
    localStorage.setItem(STORAGE_KEY_CREDITS, JSON.stringify(balances));

    const history = this.getHistory();
    history.unshift({
      id: `tx-${Date.now()}`,
      type: "spent",
      category: spentCategory,
      amount,
      description,
      date: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));

    // Atualiza o streak de estudo ativo hoje
    this.recordStudyActivity();

    window.dispatchEvent(new Event("swaliclass_credits_updated"));
    return true;
  },

  addCredits(amount: number, category: "contribution" | "purchased" | "plan", description: string) {
    const balances = this.getBalances();
    if (category === "contribution") balances.contributionCredits += amount;
    else if (category === "purchased") balances.purchasedCredits += amount;
    else balances.planCredits += amount;

    balances.total =
      balances.planCredits + balances.contributionCredits + balances.purchasedCredits;
    localStorage.setItem(STORAGE_KEY_CREDITS, JSON.stringify(balances));

    const history = this.getHistory();
    history.unshift({
      id: `tx-${Date.now()}`,
      type: category === "purchased" ? "recharge" : "earned",
      category,
      amount,
      description,
      date: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));

    window.dispatchEvent(new Event("swaliclass_credits_updated"));
  },

  recordStudyActivity() {
    const streak = this.getStreak();
    const today = new Date().toDateString();
    const lastDate = new Date(streak.lastStudyDate).toDateString();

    if (today !== lastDate) {
      streak.currentDays += 1;
      streak.longestDays = Math.max(streak.longestDays, streak.currentDays);
      streak.lastStudyDate = new Date().toISOString();
      streak.activeToday = true;
      localStorage.setItem(STORAGE_KEY_STREAK, JSON.stringify(streak));
      window.dispatchEvent(new Event("swaliclass_streak_updated"));
    }
  },
};
