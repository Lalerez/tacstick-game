// ============================================================
//  deck.js — Gestión de mazos y cartas en mano
// ============================================================

class DeckManager {
  constructor(deckCards) {
    // deckCards: array of card data objects (troops + powers), 8 total
    this.fullDeck = [...deckCards];
    this.drawPile = this._shuffle([...deckCards]);
    this.hand = []; // 4 cards
    this._fillHand();
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _fillHand() {
    while (this.hand.length < 4 && this.drawPile.length > 0) {
      this.hand.push(this.drawPile.shift());
    }
  }

  // Play card at hand index 0-3. Returns the card data or null if slot empty.
  playCard(handIndex) {
    if (handIndex < 0 || handIndex >= this.hand.length) return null;
    const card = this.hand[handIndex];
    
    // La nueva carta toma el lugar exacto de la carta jugada
    // Así evitamos que las cartas se recorran hacia la izquierda
    const nextCard = this.drawPile.shift();
    this.hand[handIndex] = nextCard;
    
    // Mandamos la carta jugada al fondo del mazo
    this.drawPile.push(card);
    
    return card;
  }

  getHand() {
    return this.hand;
  }
}

// ─── Helper: build the 8-card deck from player selections ───
// troopIds: array of 6 troop IDs (may repeat, max 2 of same)
// godId: string, used to fetch powers
function buildDeck(troopIds, godId) {
  const god = GODS[godId];
  const powers = god.powers; // 2 powers
  const troops = troopIds.map(id => TROOPS.find(t => t.id === id)).filter(Boolean);
  return [...troops, ...powers];
}
