import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders the title and children when open', () => {
    render(
      <Modal open title="Confirm" onOpenChange={() => {}}>
        <p>Are you sure?</p>
      </Modal>
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(
      <Modal open={false} title="Confirm" onOpenChange={() => {}}>
        <p>Are you sure?</p>
      </Modal>
    );
    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
  });
});
