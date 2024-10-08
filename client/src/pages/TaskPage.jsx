import React, { useEffect } from 'react'
import { useTasks } from '../context/TaskContext'

function TaskPage() {
  const { getTasks, tasks } = useTasks()

  useEffect(() => {
    getTasks()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Lista de Tareas</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tasks.map(task => (
          <div key={task._id} className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-2 text-zinc-700">{task.title}</h2>
            <p className="text-gray-600">{task.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TaskPage
