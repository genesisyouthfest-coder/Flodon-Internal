export default {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`\n✅ Flodon Bot is online as ${client.user.tag}`)
    console.log(`📊 Serving ${client.guilds.cache.size} server(s)`)
    console.log(`⚔️  Commands loaded: ${client.commands.size}\n`)

    client.user.setPresence({
      activities: [{ name: 'sales operations', type: 3 }], // Watching
      status: 'online',
    })
  },
}
