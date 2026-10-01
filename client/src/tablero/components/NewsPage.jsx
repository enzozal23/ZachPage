const RELEASES = [
  {
    date: '1 de octubre de 2026',
    groups: [
      {
        title: 'Clientes',
        items: [
          'Hay una sección Clientes para crear, editar y eliminar.',
          'Cada cliente tiene nombre, apellido, DNI o CUIT, razón social, mail, teléfono, si es persona física o jurídica, y criticidad alta, media o baja con color.',
          'Se pueden importar desde Excel. Hay un modelo para descargar y, si el documento ya existe, ese cliente se actualiza.',
        ],
      },
      {
        title: 'Logs',
        items: [
          'Los logs de acciones se mejoraron. Ya no queda un update genérico de la ficha.',
          'Cada registro dice si se agregó, se eliminó o se actualizó, y muestra el dato: etiqueta, tarea, historial, título, estado, responsable, fecha o expediente.',
          'Monitoreo también tiene logs de mails, de sesión y de sistema.',
        ],
      },
      {
        title: 'Importaciones',
        items: [
          'Se puede borrar una importación. También se borran las tarjetas que salieron de ese archivo, después de confirmar.',
          'Al importar un Word, la asignación rápida muestra el título a la izquierda y, a la derecha, responsable, fecha límite y número de expediente.',
          'Cambiar el número de expediente actualiza el título y la línea Expediente de la descripción.',
        ],
      },
      {
        title: 'Ficha',
        items: [
          'El bloque de tareas se llama Tareas y cada una muestra su título.',
          'En la ficha se puede eliminar cada tarea, cada etiqueta y cada nota del historial.',
          'También se puede eliminar la tarjeta completa.',
        ],
      },
      {
        title: 'General',
        items: [
          'Las confirmaciones para eliminar usan SweetAlert en toda la aplicación.',
          'Se sacó la tienda: productos, ventas y su acceso.',
          'El primer ingreso ya no avisa que no se pudo leer el tablero. Ahora se carga cuando la sesión está lista.',
        ],
      },
    ],
  },
  {
    date: '30 de septiembre de 2026',
    groups: [
      {
        title: 'Tablero',
        items: [
          'La ficha ocupa casi toda la pantalla.',
          'Cada tarjeta marca la prioridad con una franja de color.',
          'Si la tarjeta venció, el fondo es un rojo muy suave. Si faltan 7 días o menos, es amarillo. Si faltan 14 días o más, queda sin ese color.',
        ],
      },
      {
        title: 'Modo oscuro',
        items: [
          'El modo oscuro se rehizo y se recuerda entre visitas.',
          'El login conserva su diseño propio.',
        ],
      },
      {
        title: 'Usuarios',
        items: [
          'Se pueden crear, editar y eliminar usuarios: nombre, mail y contraseña.',
          'El acceso está en el ícono de persona. Cerrar sesión también es un ícono.',
        ],
      },
      {
        title: 'Avisos',
        items: [
          'El aviso automático de vencimientos queda programado para la madrugada, así un atraso sigue llegando de mañana.',
        ],
      },
    ],
  },
]

function NewsPage() {
  return (
    <section className="flex flex-1 flex-col gap-4 px-6 py-5">
      <div>
        <h2 className="text-xl font-semibold text-ink">Novedades</h2>
        <p className="mt-1 text-sm text-muted">Qué cambió en Lexora.</p>
      </div>

      {RELEASES.map((release) => (
        <article key={release.date} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
          <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">{release.date}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {release.groups.map((group) => (
              <div key={group.title} className="rounded-xl bg-sunken p-4">
                <h4 className="font-semibold text-ink">{group.title}</h4>
                <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-sm text-muted">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  )
}

export default NewsPage
