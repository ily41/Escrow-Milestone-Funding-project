const db = require("./db");

module.exports = {
  async findUserByWallet(wallet) {
    // Look up user in Django's users_user table
    const q = `
      SELECT backer_id FROM backers 
      WHERE LOWER(wallet_address) = $1
    `;
    const res = await db.query(q, [wallet.toLowerCase()]);
    if (res.rowCount > 0) {
      return res.rows[0].backer_id;
    }
    return null;
  }
};
