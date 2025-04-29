import TaskStatus from '@models/constants/task-status'

abstract class Task {
  readonly linkText: string
  readonly href: string
  readonly id: string
  public status: string

  protected constructor(linkText: string, id: string, href: string) {
    this.linkText = linkText
    this.id = id
    this.href = href
    this.status = TaskStatus.NOT_STARTED
  }

  setStatus(status: string) {
    this.status = status
  }
}

abstract class Tasks<T extends Task> {
  public tasks: T[];

  protected constructor(tasks: T[]) {
    this.tasks = tasks
  }

  incompleteTasks() {
    return (
      this.tasks.filter(
        (task) => task.status !== TaskStatus.COMPLETED_CANNOT_START && task.status !== TaskStatus.COMPLETED
      ).length > 0
    )
  }

  findTaskById(taskId: string) {
    const task = this.tasks.find((t) => t.id === taskId)
    if (task === undefined) {
      throw new Error(`Task not found in task list [id: ${taskId}]`)
    }
    return task
  }
}

export { Tasks, Task }
