import React, { useEffect, useState, useRef } from 'react';
import classNames from 'classnames';
import { UserWarning } from './UserWarning';
import {
  addTodo,
  deleteTodo,
  getTodos,
  updateTodo,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Status } from './types/Status';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<Status>(Status.All);
  const [title, setTitle] = useState<string>('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [deletingTodoIds, setDeletingTodoIds] = useState<number[]>([]);
  const [loadingTodoIds, setLoadingTodoIds] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const activeTodosCount = todos.filter(todo => !todo.completed).length;
  const isAllCompleted = todos.length > 0 && activeTodosCount === 0;
  const hasCompletedTodos = todos.some(todo => todo.completed);

  const filteredTodos = todos.filter(todo => {
    switch (filterStatus) {
      case Status.Active:
        return !todo.completed;
      case Status.Completed:
        return todo.completed;
      default:
        return true;
    }
  });

  useEffect(() => {
    setErrorMessage('');
    getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'));
  }, []);

  useEffect(() => {
    if (!errorMessage) return;
    const timerId = setTimeout(() => setErrorMessage(''), 3000);
    return () => clearTimeout(timerId);
  }, [errorMessage]);

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setErrorMessage('Title should not be empty');
      return;
    }

    setLoading(true);
    setTempTodo({
      userId: USER_ID,
      id: 0,
      title: trimmedTitle,
      completed: false,
    });

    addTodo(trimmedTitle)
      .then(newTodo => {
        setTodos(prev => [...prev, newTodo]);
        setTitle('');
      })
      .catch(() => setErrorMessage('Unable to add a todo'))
      .finally(() => {
        setTempTodo(null);
        setLoading(false);
      });
  };

  const handleDeletePost = (id: number) => {
    setDeletingTodoIds(ids => [...ids, id]);

    deleteTodo(id)
      .then(() => {
        setTodos(curr => curr.filter(todo => todo.id !== id));
        inputRef.current?.focus();
      })
      .catch(() => setErrorMessage('Unable to delete a todo'))
      .finally(() => {
        setDeletingTodoIds(ids => ids.filter(todoId => todoId !== id));
      });
  };

  const handleClearCompleted = () => {
    todos.forEach(todo => {
      if (todo.completed) {
        handleDeletePost(todo.id);
      }
    });
  };

  const handleToggleTodo = (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    setLoadingTodoIds(ids => [...ids, id]);

    updateTodo(id, { completed: !todo.completed })
      .then(updatedTodo => {
        setTodos(curr =>
          curr.map(t =>
            t.id === id ? { ...t, completed: updatedTodo.completed } : t,
          ),
        );
      })
      .catch(() => setErrorMessage('Unable to update a todo'))
      .finally(() => {
        setLoadingTodoIds(ids => ids.filter(todoId => todoId !== id));
      });
  };

  const handleUpdateTodo = (
    id: number,
    updates: Partial<Todo>,
  ): Promise<void> => {
    setLoadingTodoIds(ids => [...ids, id]);

    return updateTodo(id, updates)
      .then(updatedTodo => {
        setTodos(curr => curr.map(t => (t.id === id ? updatedTodo : t)));
      })
      .catch(error => {
        setErrorMessage('Unable to update a todo');
        throw error;
      })
      .finally(() => {
        setLoadingTodoIds(ids => ids.filter(todoId => todoId !== id));
      });
  };

  const handleToggleAll = () => {
    const todosToUpdate = todos.filter(
      todo => todo.completed === isAllCompleted,
    );
    const idsToUpdate = todosToUpdate.map(todo => todo.id);

    setLoadingTodoIds(ids => [...ids, ...idsToUpdate]);

    const updatePromises = todosToUpdate.map(todo =>
      updateTodo(todo.id, { completed: !isAllCompleted }),
    );

    Promise.allSettled(updatePromises)
      .then(results => {
        const successfulIds = results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<Todo>).value.id);

        const failedCount = results.length - successfulIds.length;

        if (failedCount > 0) {
          setErrorMessage('Unable to update some todos');
        }

        setTodos(curr =>
          curr.map(todo => {
            if (successfulIds.includes(todo.id)) {
              return { ...todo, completed: !isAllCompleted };
            }
            return todo;
          }),
        );
      })
      .finally(() => {
        setLoadingTodoIds(ids => ids.filter(id => !idsToUpdate.includes(id)));
      });
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          title={title}
          setTitle={setTitle}
          onSubmit={handleSubmit}
          inputRef={inputRef}
          loading={loading}
          isAllCompleted={isAllCompleted}
          onToggleAll={handleToggleAll}
          hasTodos={todos.length > 0}
        />

        {todos.length > 0 && (
          <>
            <TodoList
              todos={filteredTodos}
              tempTodo={tempTodo}
              deletingTodoIds={deletingTodoIds}
              onDelete={handleDeletePost}
              loadingTodoIds={loadingTodoIds}
              onToggle={handleToggleTodo}
              onUpdate={handleUpdateTodo}
            />

            <Footer
              activeCount={activeTodosCount}
              filterStatus={filterStatus}
              hasCompletedTodos={hasCompletedTodos}
              onFilterChange={setFilterStatus}
              onClearCompleted={handleClearCompleted}
            />
          </>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !errorMessage },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          aria-label="Hide error"
          onClick={() => setErrorMessage('')}
        />
        {errorMessage}
      </div>
    </div>
  );
};
