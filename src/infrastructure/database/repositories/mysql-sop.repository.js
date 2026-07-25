'use strict';

class MysqlSopRepository {
  constructor(executor) {
    this.executor = executor;
  }

  async createPlaybook(playbook) {
    await this.executor.execute(
      `INSERT INTO sop_playbooks (sop_id, name, owner_agent_id)
       VALUES (?, ?, ?)`,
      [playbook.sopId, playbook.name, playbook.ownerAgentId],
    );
  }

  async nextVersion(sopId) {
    const [rows] = await this.executor.execute(
      'SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM sop_versions WHERE sop_id = ?',
      [sopId],
    );
    return Number(rows[0].next_version);
  }

  async createVersion(version) {
    await this.executor.execute(
      `INSERT INTO sop_versions (
         sop_id, version, definition, definition_hash, effective_at, created_by
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        version.sopId, version.version, JSON.stringify(version.definition),
        version.definitionHash, version.effectiveAt, version.createdBy,
      ],
    );
    return version;
  }

  async findVersionForUpdate(sopId, version) {
    const [rows] = await this.executor.execute(
      `SELECT * FROM sop_versions
       WHERE sop_id = ? AND version = ? LIMIT 1 FOR UPDATE`,
      [sopId, version],
    );
    return rows[0] || null;
  }

  async approve(sopId, version, actorId, at) {
    const [result] = await this.executor.execute(
      `UPDATE sop_versions SET status = 'approved', approved_by = ?, approved_at = ?
       WHERE sop_id = ? AND version = ? AND status = 'draft'`,
      [actorId, at, sopId, version],
    );
    return result.affectedRows === 1;
  }

  async activate(sopId, version) {
    await this.executor.execute(
      `UPDATE sop_versions SET status = 'retired'
       WHERE sop_id = ? AND status = 'active'`,
      [sopId],
    );
    const [result] = await this.executor.execute(
      `UPDATE sop_versions SET status = 'active'
       WHERE sop_id = ? AND version = ? AND status IN ('approved', 'retired')`,
      [sopId, version],
    );
    if (result.affectedRows !== 1) return false;
    await this.executor.execute(
      'UPDATE sop_playbooks SET active_version = ? WHERE sop_id = ?',
      [version, sopId],
    );
    return true;
  }
}

module.exports = MysqlSopRepository;
