const db = require("./db");

module.exports = {
  async upsertCreator(wallet) {
    const q = `
      INSERT INTO creators (wallet_address, status)
      VALUES ($1,1)
      ON CONFLICT (wallet_address)
      DO UPDATE SET wallet_address = EXCLUDED.wallet_address
      RETURNING creator_id;
    `;
    return (await db.query(q, [wallet.toLowerCase()])).rows[0].creator_id;
  },

  async upsertBacker(wallet) {
    const q = `
      INSERT INTO backers (wallet_address, status)
      VALUES ($1,1)
      ON CONFLICT (wallet_address)
      DO UPDATE SET wallet_address = EXCLUDED.wallet_address
      RETURNING backer_id;
    `;
    return (await db.query(q, [wallet.toLowerCase()])).rows[0].backer_id;
  }
};
