const db = require("./db");

module.exports = {
  async findUserByWallet(wallet) {
    // Look up user in Django's users_user table
    const q = `
      SELECT id FROM users_user 
      WHERE LOWER(wallet_address) = $1
    `;
    const res = await db.query(q, [wallet.toLowerCase()]);
    if (res.rowCount > 0) {
      return res.rows[0].id;
    }
    return null;
  }
};
