import { REST, Routes } from 'discord.js'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join } from 'path'
import { readdirSync } from 'fs'
import '@flodon/core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const commands = []
const commandsPath = join(__dirname, 'commands')
const commandFiles = readdirSync(commandsPath).filter(f => f.endsWith('.js'))

for (const file of commandFiles) {
  const command = await import(pathToFileURL(join(commandsPath, file)).href)
  commands.push(command.default.data.toJSON())
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN)

;(async () => {
  try {
    console.log(`\n🔄 Registering ${commands.length} slash commands to guild ${process.env.DISCORD_GUILD_ID}...`)

    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
      { body: commands },
    )

    console.log(`✅ Successfully registered ${data.length} commands!\n`)
    data.forEach(cmd => console.log(`   /${cmd.name} — ${cmd.description}`))
  } catch (error) {
    console.error('Error registering commands:', error)
  }
})()
