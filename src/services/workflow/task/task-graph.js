/**
 * @fileoverview task-graph - Provides task-graph functionality.
 */
'use strict';

/**
 * TaskGraph
 * Manages task graph logic.
 */
class TaskGraph {
  #tasks;
  #order;

  /**
   * constructor - Executes constructor.
   * @param {*} tasks - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new TypeError('Task graph requires at least one task');
    }
    this.#tasks = new Map(tasks.map((task) => [task.id, Object.freeze({
      ...task,
      dependsOn: Object.freeze([...(task.dependsOn || [])]),
    })]));
    if (this.#tasks.size !== tasks.length) throw new TypeError('Task IDs must be unique');
    this.#validateDependencies();
    this.#order = Object.freeze(this.#topologicalOrder());
    Object.freeze(this);
  }

  /**
   * get - Executes get.
   * @param {*} taskId - Input parameter.
   * @returns {*} Result of operation.
   */
  get(taskId) {
    return this.#tasks.get(taskId) || null;
  }

  /**
   * list - Executes list.
   * @returns {*} Result of operation.
   */
  list() {
    return this.#order.map((taskId) => this.#tasks.get(taskId));
  }

  /**
   * ready - Executes ready.
   * @param {*} completedTaskIds - Input parameter.
   * @returns {*} Result of operation.
   */
  ready(completedTaskIds = []) {
    const completed = new Set(completedTaskIds);
    return this.list().filter((task) =>
      !completed.has(task.id)
      && task.dependsOn.every((dependency) => completed.has(dependency)));
  }

  #validateDependencies() {
    this.#tasks.forEach((task) => {
      task.dependsOn.forEach((dependency) => {
        if (!this.#tasks.has(dependency)) {
          throw new TypeError(`Unknown task dependency: ${task.id} -> ${dependency}`);
        }
        if (dependency === task.id) {
          throw new TypeError(`Task cannot depend on itself: ${task.id}`);
        }
      });
    });
  }

  #topologicalOrder() {
    const indegree = new Map(Array.from(this.#tasks.keys(), (id) => [id, 0]));
    const dependents = new Map(Array.from(this.#tasks.keys(), (id) => [id, []]));
    this.#tasks.forEach((task) => {
      task.dependsOn.forEach((dependency) => {
        indegree.set(task.id, indegree.get(task.id) + 1);
        dependents.get(dependency).push(task.id);
      });
    });
    const ready = Array.from(indegree)
      .filter(([, count]) => count === 0)
      .map(([id]) => id);
    const ordered = [];
    while (ready.length > 0) {
      const id = ready.shift();
      ordered.push(id);
      dependents.get(id).forEach((dependent) => {
        indegree.set(dependent, indegree.get(dependent) - 1);
        if (indegree.get(dependent) === 0) ready.push(dependent);
      });
    }
    if (ordered.length !== this.#tasks.size) throw new TypeError('Task graph contains a cycle');
    return ordered;
  }
}

module.exports = TaskGraph;
