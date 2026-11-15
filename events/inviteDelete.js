// KIKI Bot - Invite Delete Event
const InviteTracker = require('../utils/inviteTracker.js');

module.exports = {
  name: 'inviteDelete',
  execute(invite, client) {
    try {
      InviteTracker.handleInviteDelete(invite);
    } catch (err) {
      console.error('[EVENT inviteDelete ERROR]', err.message);
    }
  }
};
