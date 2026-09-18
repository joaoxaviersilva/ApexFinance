import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShell } from '../src/index.js';

describe('AppShell', () => {
  it('renderiza sidebar, header e conteúdo principal em regiões separadas', () => {
    render(
      <AppShell
        sidebar={
          <nav aria-label="Navegação principal">
            <span>Navegação</span>
          </nav>
        }
        header={<div>Cabeçalho</div>}
      >
        <p>Conteúdo da página</p>
      </AppShell>,
    );

    expect(
      screen.getByRole('navigation', {
        name: /navegação principal/i,
      }),
    ).toHaveTextContent('Navegação');

    expect(screen.getByRole('banner')).toHaveTextContent('Cabeçalho');

    expect(screen.getByRole('main')).toHaveTextContent('Conteúdo da página');
  });
});
