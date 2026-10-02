import User from '../models/user.models.js'
import { armarBackup, restaurarBackup } from '../libs/backup.js'
import { requestIp, writeActivities } from '../libs/activityLog.js'

async function actorOf(req) {
  const userDoc = req.user?.id ? await User.findById(req.user.id).select('username email') : null
  return {
    userId: String(req.user?.id || ''),
    username: userDoc?.username || '',
    email: userDoc?.email || '',
    ip: requestIp(req),
  }
}

export const downloadBackup = async (req, res) => {
  try {
    const backup = await armarBackup()
    const actor = await actorOf(req)
    const day = backup.createdAt.slice(0, 10)
    await writeActivities([{
      action: 'create',
      entity: 'backup',
      ticketId: '',
      ticketTitle: 'Backup',
      summary: `Generó un backup (${backup.kanban.tickets.length} tarjetas, ${backup.clients.length} clientes, ${backup.users.length} usuarios)`,
      ...actor,
      detail: {
        tickets: backup.kanban.tickets.length,
        clients: backup.clients.length,
        users: backup.users.length,
      },
    }])
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="lexora-backup-${day}.json"`)
    res.send(JSON.stringify(backup))
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'No se pudo generar el backup.' })
  }
}

export const importBackup = async (req, res) => {
  try {
    const result = await restaurarBackup(req.body, req.user?.id)
    if (result.errors.length) return res.status(400).json({ message: result.errors.join(' ') })
    const actor = await actorOf(req)
    await writeActivities([{
      action: 'update',
      entity: 'backup',
      ticketId: '',
      ticketTitle: 'Backup',
      summary: `Importó un backup (${result.counts.tickets} tarjetas, ${result.counts.clients} clientes, ${result.counts.users} usuarios)`,
      ...actor,
      detail: result.counts,
    }])
    res.json({ ok: true, ...result.counts })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'No se pudo importar el backup.' })
  }
}
