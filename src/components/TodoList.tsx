import React from 'react';
import { Todo } from '../types/Todo';
import { TodoItem } from './TodoItem';

interface Props {
  todos: Todo[];
  tempTodo: Todo | null;
  deletingTodoIds: number[];
  loadingTodoIds: number[];
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
  onUpdate: (id: number, updates: Partial<Todo>) => Promise<void>;
}

export const TodoList: React.FC<Props> = ({
  todos,
  tempTodo,
  deletingTodoIds,
  loadingTodoIds,
  onToggle,
  onDelete,
  onUpdate,
}) => {
  return (
    <section className="todoapp__main" data-cy="TodoList">
      {todos.map(todo => (
        <TodoItem
          todo={todo}
          key={todo.id}
          onDelete={onDelete}
          onToggle={onToggle}
          onUpdate={onUpdate}
          isLoading={
            deletingTodoIds.includes(todo.id) ||
            loadingTodoIds.includes(todo.id)
          }
        />
      ))}

      {tempTodo && (
        <TodoItem
          todo={tempTodo}
          isLoading={true}
          onDelete={() => {}}
          onToggle={() => {}}
          onUpdate={() => Promise.resolve()}
        />
      )}
    </section>
  );
};
