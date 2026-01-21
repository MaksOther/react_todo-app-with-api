import React from 'react';
import classNames from 'classnames';

interface Props {
  title: string;
  setTitle: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  loading: boolean;
  isAllCompleted: boolean;
  hasTodos: boolean;
  onToggleAll: () => void;
}

export const Header: React.FC<Props> = ({
  title,
  setTitle,
  onSubmit,
  inputRef,
  loading,
  isAllCompleted,
  hasTodos,
  onToggleAll,
}) => {
  return (
    <header className="todoapp__header">
      {hasTodos && (
        <button
          type="button"
          className={classNames('todoapp__toggle-all', {
            active: isAllCompleted,
          })}
          data-cy="ToggleAllButton"
          aria-label="Toggle all todos"
          onClick={onToggleAll}
        />
      )}

      <form onSubmit={onSubmit}>
        <input
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={loading}
        />
      </form>
    </header>
  );
};
