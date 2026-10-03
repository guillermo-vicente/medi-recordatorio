import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renderiza el titulo correctamente', async () => {
    await render(<EmptyState title="Sin medicamentos" />);
    expect(screen.getByText('Sin medicamentos')).toBeTruthy();
  });

  it('renderiza el subtitulo cuando se pasa como prop', async () => {
    await render(
      <EmptyState
        title="Sin medicamentos"
        subtitle="Toca el boton + para agregar"
      />
    );
    expect(screen.getByText('Toca el boton + para agregar')).toBeTruthy();
  });

  it('usa el emoji por defecto cuando no se pasa la prop', async () => {
    await render(<EmptyState title="Sin datos" />);
    expect(screen.getByText('📋')).toBeTruthy();
  });

  it('renderiza el emoji personalizado cuando se pasa como prop', async () => {
    await render(<EmptyState emoji="💊" title="Sin medicamentos" />);
    expect(screen.getByText('💊')).toBeTruthy();
  });

  it('no renderiza subtitulo cuando no se pasa', async () => {
    await render(<EmptyState title="Sin datos" />);
    expect(screen.queryByText('Toca el boton +')).toBeNull();
  });
});