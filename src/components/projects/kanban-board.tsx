'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Plus, MoreHorizontal } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useToast } from '@/components/ui/use-toast'

type Task = {
  id: string
  title: string
  description: string | null
  priority: number
  dueDate: Date | null
  tags: string
  status: string
}

type Column = {
  id: string
  name: string
  order: number
  tasks: Task[]
}

interface KanbanBoardProps {
  columns: Column[]
  projectId: string
}

function SortableTask({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const tags = JSON.parse(task.tags || '[]') as string[]
  const priorityColors = {
    1: 'bg-gray-100 text-gray-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-orange-100 text-orange-800',
    4: 'bg-red-100 text-red-800',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="p-3 hover:shadow-md transition-shadow">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="font-medium text-sm flex-1">{task.title}</div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            {task.dueDate && (
              <div className="text-xs text-muted-foreground">
                📅 {formatDate(task.dueDate)}
              </div>
            )}
            <Badge
              variant="outline"
              className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors[1]}`}
            >
              P{task.priority}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}

function SortableColumn({ column, tasks }: { column: Column; tasks: Task[] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {column.name}
            <Badge variant="secondary" className="ml-2">
              {tasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Brak zadań
              </p>
            ) : (
              tasks.map((task) => (
                <SortableTask key={task.id} task={task} />
              ))
            )}
          </SortableContext>
          
          <Button variant="ghost" size="sm" className="w-full mt-2">
            <Plus className="mr-2 h-3 w-3" />
            Dodaj zadanie
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function KanbanBoard({ columns, projectId }: KanbanBoardProps) {
  const { toast } = useToast()
  const [localColumns, setLocalColumns] = useState(columns)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the columns and tasks
    const activeColumn = localColumns.find(col => 
      col.tasks.some(task => task.id === activeId)
    )
    const overColumn = localColumns.find(col => 
      col.id === overId || col.tasks.some(task => task.id === overId)
    )

    if (!activeColumn || !overColumn) return

    const activeTask = activeColumn.tasks.find(task => task.id === activeId)
    if (!activeTask) return

    // If moving within the same column
    if (activeColumn.id === overColumn.id) {
      const oldIndex = activeColumn.tasks.findIndex(task => task.id === activeId)
      const newIndex = overColumn.tasks.findIndex(task => task.id === overId)
      
      if (oldIndex !== newIndex) {
        const newTasks = arrayMove(activeColumn.tasks, oldIndex, newIndex)
        setLocalColumns(prev => prev.map(col => 
          col.id === activeColumn.id 
            ? { ...col, tasks: newTasks }
            : col
        ))
      }
    } else {
      // Moving between columns
      const newActiveTasks = activeColumn.tasks.filter(task => task.id !== activeId)
      const overIndex = overColumn.tasks.findIndex(task => task.id === overId)
      const newOverTasks = [...overColumn.tasks]
      newOverTasks.splice(overIndex, 0, { ...activeTask, status: overColumn.name.toLowerCase() })

      setLocalColumns(prev => prev.map(col => {
        if (col.id === activeColumn.id) {
          return { ...col, tasks: newActiveTasks }
        } else if (col.id === overColumn.id) {
          return { ...col, tasks: newOverTasks }
        }
        return col
      }))

      // Update task in database
      try {
        await fetch(`/api/tasks/${activeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            columnId: overColumn.id,
            status: overColumn.name.toLowerCase(),
          }),
        })
      } catch (error) {
        toast({
          title: 'Błąd',
          description: 'Nie udało się zaktualizować zadania',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {localColumns.map((column) => (
          <SortableColumn
            key={column.id}
            column={column}
            tasks={column.tasks}
          />
        ))}
      </div>
    </DndContext>
  )
}