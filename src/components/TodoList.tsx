import React from 'react';
import { TodoItem } from './TodoItem';
import { Todo } from '../types/Todo';

type Props = {
  todos: Todo[];
  tempTodo: Todo | null;
  onDelete: (id: number) => void;
  deleteTodoId: number[];
  onUpdate: (todo: Todo) => Promise<void>;
  onToggle: (id: number) => void;
  loadingTodoIds: number[];
};

export const TodoList: React.FC<Props> = ({
  todos,
  tempTodo,
  onDelete,
  deleteTodoId,
  onUpdate,
  onToggle,
  loadingTodoIds,
}) => {
  return (
    <section className="todoapp__main" data-cy="TodoList">
      {todos.map(todo => (
        <TodoItem
          todo={todo}
          key={todo.id}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onToggle={onToggle}
          isLoading={
            deleteTodoId.includes(todo.id) || loadingTodoIds.includes(todo.id)
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
