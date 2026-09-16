import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../src/app/App.js';

describe('Aplicação ApexFinance', () => {
  it('renderiza a fundação do produto', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toHaveTextContent('ApexFinance');

    expect(
      screen.getByRole('heading', {
        name: 'Cockpit de Inteligência Financeira',
      }),
    ).toBeInTheDocument();
  });
});
