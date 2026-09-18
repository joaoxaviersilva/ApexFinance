import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ModulePlaceholderPage } from '../src/features/app-shell/pages/ModulePlaceholderPage';

describe('ModulePlaceholderPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renderiza título e descrição do módulo recebido', () => {
    render(
      <ModulePlaceholderPage
        title="Carteira"
        description="Gerencie seus ativos e movimentações financeiras."
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: /carteira/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/gerencie seus ativos e movimentações financeiras/i),
    ).toBeInTheDocument();
  });
});
