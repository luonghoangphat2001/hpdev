# Identity and Trust Boundaries v1

- Ecommerce is the only business SSOT and the only system allowed to mutate
  business state.
- OpenClaw owns orchestration state, approvals, audit and agent memory. It may
  request allowlisted Ecommerce actions but never write the Ecommerce database.
- dan_ai owns the CEO interface and Discord session. OpenClaw never stores the
  Discord bot token.

The CEO identity boundary requires `CEO_DISCORD_USER_ID`, `DISCORD_GUILD_ID`
and `CEO_DISCORD_CHANNEL_ID`. Values are deployment secrets/configuration and
must never be committed.

Each system-to-system direction has a separate credential. Sharing one global
token across Ecommerce, OpenClaw and dan_ai is prohibited. Secret definitions
record issuer, permitted holders and environment variable names only.
