import React, { useEffect } from 'react';
import { UserWarning } from './UserWarning';
import {
  addTodo,
  deleteTodo,
  getTodos,
  updateTodo,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import classNames from 'classnames';
import { Footer } from './components/Footer';
import { TodoList } from './components/TodoList';
import { Header } from './components/Header';
import { Status } from './types/Status';

export const App: React.FC = () => {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [filter, setFilter] = React.useState<Status>(Status.All);

  const [title, setTitle] = React.useState<string>('');
  const [tempTodo, setTempTodo] = React.useState<Todo | null>(null);
  const [deleteTodoIds, setDeleteTodoIds] = React.useState<number[]>([]);
  const [loadingTodoIds, setLoadingTodoIds] = React.useState<number[]>([]);

  const focusedElement = React.useRef<HTMLInputElement | null>(null);

  const activeTodo = todos.every(todo => todo.completed);
  const hasCompletedTodos = todos.some(todo => todo.completed);
  const activeTodosCount = todos.filter(todo => !todo.completed).length;

  const filteredTodos = todos.filter(todo => {
    if (filter === Status.Completed) {
      return todo.completed;
    }

    if (filter === Status.Active) {
      return !todo.completed;
    }

    return true;
  });

  useEffect(() => {
    setError('');
    setLoading(true);

    getTodos()
      .then(setTodos)
      .catch(() => {
        setError('Unable to load todos');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = setTimeout(() => {
      setError('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!loading) {
      focusedElement.current?.focus();
    }
  }, [loading]);

  const handleTodoAdd = (e: React.FormEvent) => {
    e.preventDefault();

    const titleTrim = title.trim();

    if (!titleTrim) {
      setError('Title should not be empty');

      return;
    }

    setLoading(true);

    const tempTodoItem: Todo = {
      userId: USER_ID,
      id: 0,
      title: titleTrim,
      completed: false,
    };

    setTempTodo(tempTodoItem);

    addTodo(titleTrim)
      .then(newTodo => {
        setTodos(prevTodos => [...prevTodos, newTodo]);
        setTitle('');
      })
      .catch(() => setError('Unable to add a todo'))
      .finally(() => {
        setTempTodo(null);
        setLoading(false);
      });
  };

  const handleTodoDelete = (id: number) => {
    setDeleteTodoIds(prev => [...prev, id]);

    deleteTodo(id)
      .then(() => {
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
        focusedElement.current?.focus();
      })
      .catch(() => setError('Unable to delete a todo'))
      .finally(() => {
        setDeleteTodoIds(current => current.filter(todoId => todoId !== id));
      });
  };

  const handleRemoveAllCompleted = () => {
    todos.forEach(todo => {
      if (todo.completed) {
        handleTodoDelete(todo.id);
      }
    });
  };

  const handleUpdateTodo = (todo: Todo) => {
    setLoadingTodoIds(ids => [...ids, todo.id]);

    return updateTodo(todo)
      .then(updatedTodo => {
        setTodos(curr => curr.map(t => (t.id === todo.id ? updatedTodo : t)));
      })
      .catch(errors => {
        setError('Unable to update a todo');
        throw errors;
      })
      .finally(() => {
        setLoadingTodoIds(ids => ids.filter(id => id !== todo.id));
      });
  };

  const handleToggleTodo = (id: number) => {
    const todo = todos.find(t => t.id === id);

    if (!todo) {
      return;
    }

    handleUpdateTodo({ ...todo, completed: !todo.completed });
  };

  const handleToggleAll = () => {
    const idsToUpdate = todos
      .filter(todo => todo.completed !== !activeTodo)
      .map(t => t.id);

    setLoadingTodoIds(prev => [...prev, ...idsToUpdate]);

    Promise.allSettled(
      todos
        .filter(todo => idsToUpdate.includes(todo.id))
        .map(todo => updateTodo({ ...todo, completed: !activeTodo })),
    )
      .then(result => {
        if (result.some(r => r.status === 'rejected')) {
          setError('Unable to update some todos');
        }

        setTodos(curr =>
          curr.map(todo => {
            if (idsToUpdate.includes(todo.id)) {
              return { ...todo, completed: !activeTodo };
            }

            return todo;
          }),
        );
      })
      .finally(() => {
        setLoadingTodoIds(prev => prev.filter(id => !idsToUpdate.includes(id)));
      });
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          activeTodo={activeTodo}
          title={title}
          setTitle={setTitle}
          loading={loading}
          onTodoAdd={handleTodoAdd}
          focusedElement={focusedElement}
          toggleAll={handleToggleAll}
          hasTodos={todos.length > 0}
        />
        {todos.length > 0 && (
          <TodoList
            todos={filteredTodos}
            tempTodo={tempTodo}
            onDelete={handleTodoDelete}
            deleteTodoId={deleteTodoIds}
            onUpdate={handleUpdateTodo}
            onToggle={handleToggleTodo}
            loadingTodoIds={loadingTodoIds}
          />
        )}

        {todos.length > 0 && (
          <Footer
            filter={filter}
            setFilter={setFilter}
            hasCompletedTodos={hasCompletedTodos}
            activeTodosCount={activeTodosCount}
            onClearCompleted={handleRemoveAllCompleted}
          />
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !error },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setError('')}
        />
        {error}
      </div>
    </div>
  );
};
